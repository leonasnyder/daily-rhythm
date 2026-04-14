/**
 * CalDAV client — designed for iCloud but works with any CalDAV server.
 * Uses only Node.js built-ins (fetch + Buffer) — no extra dependencies.
 */

export interface CalDAVEvent {
  uid: string;
  summary: string;
  dtstart: string;   // ISO-like: "20250415T140000Z" or "20250415"
  dtend: string;
  description?: string;
  location?: string;
  isAllDay: boolean;
  startTime: string | null; // "HH:MM" local or null for all-day
  endTime: string | null;
  isRecurring?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function basicAuth(username: string, password: string) {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

/**
 * Extract the *first* occurrence of a tag value from CalDAV XML.
 * Handles both namespaced (<D:href>) and plain (<href>) forms.
 */
function xmlFirst(xml: string, localName: string): string | null {
  const re = new RegExp(`<[^>]*:?${localName}[^>]*>\\s*([^<]+)\\s*<`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

/**
 * Extract all occurrences of a tag value.
 */
function xmlAll(xml: string, localName: string): string[] {
  const re = new RegExp(`<[^>]*:?${localName}[^>]*>\\s*([^<]+)\\s*<`, 'gi');
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) results.push(m[1].trim());
  return results;
}

/**
 * Extract text content between an opening tag (possibly with attributes/namespace)
 * and its closing tag, including multi-line content.
 */
function xmlBlock(xml: string, localName: string): string | null {
  const re = new RegExp(`<[^>]*:?${localName}[^>]*>([\\s\\S]*?)<\\/?[^>]*:?${localName}\\s*>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : null;
}

function xmlAllBlocks(xml: string, localName: string): string[] {
  // Match opening tag (with optional namespace prefix and attributes)
  // and its corresponding closing tag, capturing content between them.
  // Uses a non-greedy match so nested same-name tags aren't swallowed.
  const re = new RegExp(
    `<(?:[a-zA-Z0-9_-]+:)?${localName}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-zA-Z0-9_-]+:)?${localName}\\s*>`,
    'gi'
  );
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) results.push(m[1]);
  return results;
}

/**
 * Perform a WebDAV/CalDAV request.
 * Uses redirect:'follow' so Node.js handles redirects automatically.
 * For PROPFIND/REPORT, iCloud typically responds without needing method-preserving
 * redirects when hitting the correct URL directly.
 */
async function davRequest(
  url: string,
  method: string,
  auth: string,
  body?: string,
  extraHeaders?: Record<string, string>,
): Promise<{ status: number; headers: Headers; text: string; finalUrl: string }> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: auth,
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '0',
      ...extraHeaders,
    },
    body,
    redirect: 'follow',
  });

  const text = await res.text();
  // res.url is the final URL after redirects (if any)
  return { status: res.status, headers: res.headers, text, finalUrl: res.url || url };
}

/**
 * Extract an href that is nested inside a parent tag.
 * e.g. <D:current-user-principal><D:href>/path/</D:href></D:current-user-principal>
 */
function xmlNestedHref(xml: string, parentLocalName: string): string | null {
  // Find the parent block
  const blockRe = new RegExp(
    `<[^>]*:?${parentLocalName}[^>]*/?>([\\s\\S]*?)</?[^>]*:?${parentLocalName}\\s*>`,
    'i'
  );
  const blockMatch = xml.match(blockRe);
  if (!blockMatch) return null;
  const block = blockMatch[1];
  // Find href inside it
  return xmlFirst(block, 'href');
}

// ---------------------------------------------------------------------------
// Step 1: Discover the CalDAV principal URL
// ---------------------------------------------------------------------------

export async function discoverPrincipalUrl(
  serverUrl: string,
  username: string,
  password: string
): Promise<string> {
  const auth = basicAuth(username, password);
  const base = serverUrl.replace(/\/$/, '');

  const propfindBody = `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:current-user-principal/>
  </D:prop>
</D:propfind>`;

  // iCloud: try the root URL first (avoids redirect complexity), then well-known
  const urlsToTry = [
    base + '/',
    base + '/.well-known/caldav',
  ];

  for (const url of urlsToTry) {
    try {
      const res = await davRequest(url, 'PROPFIND', auth, propfindBody, { Depth: '0' });

      if (res.status === 401) throw new Error('Invalid credentials — check your Apple ID and App-Specific Password');
      if (res.status < 200 || res.status >= 300) continue;

      // iCloud returns: <current-user-principal><href>/DSID/principal/</href></current-user-principal>
      const href = xmlNestedHref(res.text, 'current-user-principal');
      if (!href) continue;

      if (href.startsWith('http')) return href;
      const resBase = new URL(res.finalUrl);
      return `${resBase.protocol}//${resBase.host}${href}`;
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('Invalid credentials')) throw e;
      // network error — try next URL
    }
  }

  throw new Error('Could not discover CalDAV principal — check server URL and credentials');
}

// ---------------------------------------------------------------------------
// Step 2: Get the calendar-home-set URL
// ---------------------------------------------------------------------------

export async function getCalendarHome(
  principalUrl: string,
  username: string,
  password: string
): Promise<string> {
  const auth = basicAuth(username, password);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <C:calendar-home-set/>
  </D:prop>
</D:propfind>`;

  const res = await davRequest(principalUrl, 'PROPFIND', auth, body, { Depth: '0' });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to get calendar home (${res.status})`);
  }

  // calendar-home-set contains a nested href
  const href = xmlNestedHref(res.text, 'calendar-home-set');
  if (!href) throw new Error('Could not find calendar-home-set in response');

  if (href.startsWith('http')) return href;
  const base = new URL(principalUrl);
  return `${base.protocol}//${base.host}${href}`;
}

// ---------------------------------------------------------------------------
// Step 3: List calendars
// ---------------------------------------------------------------------------

export interface CalDAVCalendar {
  url: string;
  displayName: string;
  color?: string;
}

export async function listCalendars(
  calendarHome: string,
  username: string,
  password: string
): Promise<CalDAVCalendar[]> {
  const auth = basicAuth(username, password);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/" xmlns:IC="http://apple.com/ns/ical/">
  <D:prop>
    <D:displayname/>
    <D:resourcetype/>
    <IC:calendar-color/>
    <C:supported-calendar-component-set/>
  </D:prop>
</D:propfind>`;

  const res = await davRequest(calendarHome, 'PROPFIND', auth, body, { Depth: '1' });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to list calendars (${res.status})`);
  }

  const base = new URL(calendarHome);

  // Split into per-response blocks
  const responseBlocks = xmlAllBlocks(res.text, 'response');
  const calendars: CalDAVCalendar[] = [];

  for (const block of responseBlocks) {
    // Must be a calendar resource (contain <calendar/> in resourcetype)
    if (!block.includes('calendar') || block.includes('principal')) continue;
    // Must support VEVENT
    if (block.includes('supported-calendar-component-set') && !block.includes('VEVENT')) continue;

    const href = xmlFirst(block, 'href');
    if (!href) continue;

    const displayName = xmlFirst(block, 'displayname') ?? 'Calendar';
    const color = xmlFirst(block, 'calendar-color') ?? undefined;

    const url = href.startsWith('http') ? href : `${base.protocol}//${base.host}${href}`;
    calendars.push({ url, displayName, color });
  }

  return calendars;
}

// ---------------------------------------------------------------------------
// Step 4: Fetch events for a specific date
// ---------------------------------------------------------------------------

function padIcalValue(value: string): string {
  // Unfold ICAL line folding (lines starting with whitespace are continuations)
  return value.replace(/\r?\n[ \t]/g, '');
}

function parseIcalProp(lines: string[], propName: string): string | null {
  for (const line of lines) {
    if (line.toUpperCase().startsWith(propName + ':') || line.toUpperCase().startsWith(propName + ';')) {
      const idx = line.indexOf(':');
      return idx >= 0 ? line.slice(idx + 1).trim() : null;
    }
  }
  return null;
}

/**
 * Convert DTSTART/DTEND value to a "HH:MM" string or null (for all-day events).
 * iCal dates are either "YYYYMMDD" (all-day) or "YYYYMMDDTHHmmss[Z]" (timed).
 */
function icalToTime(value: string): { isAllDay: boolean; time: string | null; iso: string } {
  const clean = value.replace(/^TZID=[^:]+:/, ''); // remove TZID param if present
  if (/^\d{8}T\d{6}/.test(clean)) {
    // Timed event
    const h = clean.slice(9, 11);
    const m = clean.slice(11, 13);
    return { isAllDay: false, time: `${h}:${m}`, iso: clean };
  }
  // All-day
  return { isAllDay: true, time: null, iso: clean };
}

function parseVEvents(icalData: string): { uid: string; summary: string; dtstart: string; dtend: string; description?: string; location?: string; isAllDay: boolean; startTime: string | null; endTime: string | null; isRecurring: boolean }[] {
  const unfolded = padIcalValue(icalData);
  const events: ReturnType<typeof parseVEvents> = [];

  // Split into VEVENT blocks
  const veventRe = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi;
  let m: RegExpExecArray | null;
  while ((m = veventRe.exec(unfolded)) !== null) {
    const block = m[1];
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    const uid = parseIcalProp(lines, 'UID') ?? '';
    const summary = parseIcalProp(lines, 'SUMMARY') ?? '(No title)';
    const description = parseIcalProp(lines, 'DESCRIPTION') ?? undefined;
    const location = parseIcalProp(lines, 'LOCATION') ?? undefined;

    // Detect recurring events — they have RRULE or RECURRENCE-ID
    const isRecurring = lines.some(l => l.toUpperCase().startsWith('RRULE'));

    // DTSTART may have params: DTSTART;TZID=America/Los_Angeles:20250415T090000
    // For recurring events iCloud may return a RECURRENCE-ID with the actual occurrence date
    const recurrenceIdLine = lines.find(l => l.toUpperCase().startsWith('RECURRENCE-ID'));
    const dtstartLine = recurrenceIdLine ?? lines.find(l => l.toUpperCase().startsWith('DTSTART'));
    const dtendLine = lines.find(l => l.toUpperCase().startsWith('DTEND'));

    if (!dtstartLine) continue;

    const dtstartRaw = dtstartLine.slice(dtstartLine.indexOf(':') + 1).trim();
    const dtendRaw = dtendLine ? dtendLine.slice(dtendLine.indexOf(':') + 1).trim() : dtstartRaw;

    const start = icalToTime(dtstartRaw);
    const end = icalToTime(dtendRaw);

    events.push({
      uid,
      summary,
      dtstart: start.iso,
      dtend: end.iso,
      description,
      location,
      isAllDay: start.isAllDay,
      startTime: start.time,
      endTime: end.time,
      isRecurring,
    });
  }

  return events;
}

/**
 * Format a date as iCal UTC date-time for filter comparisons.
 * date: "YYYY-MM-DD"
 */
function toIcalDate(date: string, endOfDay = false): string {
  const d = date.replace(/-/g, '');
  return endOfDay ? `${d}T235959Z` : `${d}T000000Z`;
}

/**
 * Add N days to a YYYY-MM-DD date string.
 */
function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function fetchEventsForDate(
  calendarUrl: string,
  username: string,
  password: string,
  date: string // "YYYY-MM-DD"
): Promise<CalDAVEvent[]> {
  const auth = basicAuth(username, password);
  const start = toIcalDate(date);
  // Extend the end by 1 extra day so evening events stored in UTC
  // (e.g. 6 PM Pacific = 1 AM UTC next day) are included in the response.
  // Client-side filtering using the TZID-embedded local date removes any
  // genuine next-day events.
  const end = toIcalDate(addDays(date, 1), true);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${start}" end="${end}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

  const res = await davRequest(calendarUrl, 'REPORT', auth, body, { Depth: '1' });

  // 207 Multi-Status = normal CalDAV success, 404 = calendar not found
  if (res.status === 404) return [];
  if (res.status < 200 || (res.status >= 300 && res.status !== 207)) {
    throw new Error(`REPORT failed (${res.status})`);
  }

  // Extract calendar-data blocks (each contains a VCALENDAR)
  const calDataBlocks = xmlAllBlocks(res.text, 'calendar-data');
  const events: CalDAVEvent[] = [];

  for (const ical of calDataBlocks) {
    const parsed = parseVEvents(ical);
    events.push(...parsed);
  }

  // iCloud returns recurring event masters with the original series DTSTART,
  // not the occurrence date. The server's time-range filter already confirmed
  // these events occur on the requested date, so we trust that and fix up the
  // display date for recurring timed events.
  const compact = date.replace(/-/g, ''); // "20260414"

  const result: CalDAVEvent[] = [];
  for (const ev of events) {
    const startCompact = ev.dtstart.slice(0, 8);
    const endCompact   = ev.dtend.slice(0, 8);

    if (ev.isAllDay) {
      // All-day / multi-day: date must fall within [start, end)
      if (startCompact <= compact && compact < endCompact) result.push(ev);
      continue;
    }

    if (startCompact === compact) {
      // Timed event already has the correct date (TZID local time)
      result.push(ev);
      continue;
    }

    // UTC timestamp (ends with Z) on the next calendar day:
    // e.g. 6 PM Pacific = 01:00 UTC next day.  Accept if it's date+1 and the
    // UTC hour is < 12 (meaning local time is still "today" for UTC-12..UTC-1).
    const isUtc = ev.dtstart.endsWith('Z');
    const nextCompact = addDays(date, 1).replace(/-/g, '');
    if (isUtc && startCompact === nextCompact) {
      const utcHour = parseInt(ev.dtstart.slice(9, 11), 10);
      if (utcHour < 12) {
        // Rewrite the dtstart date to today so the panel shows the correct local date
        result.push({
          ...ev,
          dtstart: compact + ev.dtstart.slice(8),
          dtend: ev.dtend.startsWith(nextCompact)
            ? compact + ev.dtend.slice(8)
            : ev.dtend,
        });
        continue;
      }
    }

    if ((ev as { isRecurring?: boolean }).isRecurring) {
      // Distinguish two cases:
      //   A) Master event: original DTSTART is from a past series (weeks/months ago).
      //      The server confirmed today has an occurrence → substitute today's date.
      //   B) Adjacent-day event pulled in by the extended UTC window
      //      (e.g. Monday 7 PM Pacific = 2 AM Tuesday UTC, returned when querying Tuesday).
      //      startCompact = yesterday → this is NOT today's event → skip it.
      const sy = parseInt(startCompact.slice(0, 4), 10);
      const sm = parseInt(startCompact.slice(4, 6), 10) - 1;
      const sd = parseInt(startCompact.slice(6, 8), 10);
      const ty = parseInt(compact.slice(0, 4), 10);
      const tm = parseInt(compact.slice(4, 6), 10) - 1;
      const td = parseInt(compact.slice(6, 8), 10);
      const diffDays = Math.round(
        (Date.UTC(ty, tm, td) - Date.UTC(sy, sm, sd)) / 86_400_000
      );

      if (diffDays <= 0) {
        // Yesterday or earlier — not today's occurrence, skip
        continue;
      }

      // diffDays > 0: master event from the past, substitute today's date
      const timePart = ev.dtstart.slice(8); // e.g. "T190000" or "T190000Z"
      const endTimePart = ev.dtend.slice(8);
      result.push({
        ...ev,
        dtstart: compact + timePart,
        dtend:   compact + endTimePart,
      });
      continue;
    }

    // Non-recurring event on a different date — skip
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main entry: fetch all events across all calendars for a date
// ---------------------------------------------------------------------------

export async function fetchAllEventsForDate(
  serverUrl: string,
  username: string,
  password: string,
  date: string
): Promise<CalDAVEvent[]> {
  const principalUrl = await discoverPrincipalUrl(serverUrl, username, password);
  const calendarHome = await getCalendarHome(principalUrl, username, password);
  const calendars = await listCalendars(calendarHome, username, password);

  const allEvents = await Promise.all(
    calendars.map(cal => fetchEventsForDate(cal.url, username, password, date).catch(() => []))
  );

  // Deduplicate by UID — iCloud can return the same event from multiple calendars
  const seen = new Set<string>();
  return allEvents.flat().filter(ev => {
    if (seen.has(ev.uid)) return false;
    seen.add(ev.uid);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Test connection
// ---------------------------------------------------------------------------

export async function testCalDAVConnection(
  serverUrl: string,
  username: string,
  password: string
): Promise<{ success: boolean; calendarCount?: number; error?: string }> {
  try {
    const principalUrl = await discoverPrincipalUrl(serverUrl, username, password);
    const calendarHome = await getCalendarHome(principalUrl, username, password);
    const calendars = await listCalendars(calendarHome, username, password);
    return { success: true, calendarCount: calendars.length };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
