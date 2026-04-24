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
  /**
   * If this VEVENT is an override of a specific occurrence of a recurring
   * series, this holds the RECURRENCE-ID value (the *original* pre-override
   * occurrence time, used to identify which instance is being replaced).
   * Undefined on master events and non-recurring events.
   */
  recurrenceId?: string;
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

function parseVEvents(icalData: string): { uid: string; summary: string; dtstart: string; dtend: string; description?: string; location?: string; isAllDay: boolean; startTime: string | null; endTime: string | null; isRecurring: boolean; recurrenceId?: string }[] {
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

    // Detect recurring events — they have RRULE (master) or RECURRENCE-ID (override)
    const isRecurring = lines.some(l =>
      l.toUpperCase().startsWith('RRULE') || l.toUpperCase().startsWith('RECURRENCE-ID')
    );

    // DTSTART is the *effective* start of this VEVENT. For an override, that's the
    // rescheduled time (e.g. 7 PM). RECURRENCE-ID stores the *original* pre-override
    // occurrence time — it must NOT be used as DTSTART, or a rescheduled event will
    // appear at its old time.
    const dtstartLine = lines.find(l => l.toUpperCase().startsWith('DTSTART'));
    const dtendLine   = lines.find(l => l.toUpperCase().startsWith('DTEND'));
    const recurrenceIdLine = lines.find(l => l.toUpperCase().startsWith('RECURRENCE-ID'));

    if (!dtstartLine) continue;

    const dtstartRaw = dtstartLine.slice(dtstartLine.indexOf(':') + 1).trim();
    const dtendRaw = dtendLine ? dtendLine.slice(dtendLine.indexOf(':') + 1).trim() : dtstartRaw;

    const start = icalToTime(dtstartRaw);
    const end = icalToTime(dtendRaw);

    let recurrenceId: string | undefined;
    if (recurrenceIdLine) {
      const ridRaw = recurrenceIdLine.slice(recurrenceIdLine.indexOf(':') + 1).trim();
      recurrenceId = icalToTime(ridRaw).iso;
    }

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
      recurrenceId,
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

/**
 * Return the offset in minutes such that `localTime = utcTime + offset` for the
 * given IANA `timeZone` at the given UTC instant. Positive for zones east of UTC,
 * negative for zones west of UTC. (E.g. America/Los_Angeles in July → -420.)
 */
function getTzOffsetMinutes(timeZone: string, utcMs: number): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const get = (t: string) => {
    const p = parts.find(pp => pp.type === t);
    return p ? parseInt(p.value, 10) : 0;
  };
  let year = get('year');
  let month = get('month');
  let day = get('day');
  let hour = get('hour');
  const minute = get('minute');
  const second = get('second');
  // en-US reports midnight as hour "24" — normalize.
  if (hour === 24) hour = 0;
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return Math.round((localAsUtc - utcMs) / 60_000);
}

function padLeft(n: number, w: number): string {
  return String(n).padStart(w, '0');
}

function msToIcalUtc(ms: number): string {
  const d = new Date(ms);
  return (
    `${d.getUTCFullYear()}${padLeft(d.getUTCMonth() + 1, 2)}${padLeft(d.getUTCDate(), 2)}` +
    `T${padLeft(d.getUTCHours(), 2)}${padLeft(d.getUTCMinutes(), 2)}${padLeft(d.getUTCSeconds(), 2)}Z`
  );
}

/**
 * Compute the UTC instants corresponding to the start and end of the given
 * local calendar day in `timeZone`. Used to build a tight time-range filter
 * that matches exactly "today in the user's local timezone".
 */
function localDayUtcBounds(date: string, timeZone: string): { startUtc: string; endUtc: string } {
  const [y, m, d] = date.split('-').map(Number);
  // Use the UTC noon for the offset probe — avoids DST spring-forward midnight edge
  // cases where midnight local may not exist.
  const probe = Date.UTC(y, m - 1, d, 12, 0, 0);
  const offsetMin = getTzOffsetMinutes(timeZone, probe);
  // Local midnight as a UTC timestamp.
  const startMs = Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMin * 60_000;
  const endMs = startMs + 24 * 60 * 60 * 1000;
  return { startUtc: msToIcalUtc(startMs), endUtc: msToIcalUtc(endMs) };
}

/**
 * Given a UTC iCal timestamp ("YYYYMMDDTHHMMSSZ"), return the local calendar
 * date in `timeZone` as a compact "YYYYMMDD" string. Returns null if the input
 * isn't a UTC timestamp.
 */
function utcIcalToLocalCompact(icalUtc: string, timeZone: string): string | null {
  if (!/^\d{8}T\d{6}Z$/.test(icalUtc)) return null;
  const y = parseInt(icalUtc.slice(0, 4), 10);
  const mo = parseInt(icalUtc.slice(4, 6), 10);
  const d = parseInt(icalUtc.slice(6, 8), 10);
  const h = parseInt(icalUtc.slice(9, 11), 10);
  const mi = parseInt(icalUtc.slice(11, 13), 10);
  const s = parseInt(icalUtc.slice(13, 15), 10);
  const ms = Date.UTC(y, mo - 1, d, h, mi, s);
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  // en-CA formats as YYYY-MM-DD
  return dtf.format(new Date(ms)).replace(/-/g, '');
}

/**
 * Given a UTC iCal timestamp, return the local "HH:MM" in `timeZone`, or null
 * if input isn't a UTC timestamp.
 */
function utcIcalToLocalHHMM(icalUtc: string, timeZone: string): string | null {
  if (!/^\d{8}T\d{6}Z$/.test(icalUtc)) return null;
  const y = parseInt(icalUtc.slice(0, 4), 10);
  const mo = parseInt(icalUtc.slice(4, 6), 10);
  const d = parseInt(icalUtc.slice(6, 8), 10);
  const h = parseInt(icalUtc.slice(9, 11), 10);
  const mi = parseInt(icalUtc.slice(11, 13), 10);
  const s = parseInt(icalUtc.slice(13, 15), 10);
  const ms = Date.UTC(y, mo - 1, d, h, mi, s);
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const str = dtf.format(new Date(ms)); // "HH:MM"
  // Some locales may return "24:00" at midnight
  return str.replace(/^24:/, '00:');
}

export async function fetchEventsForDate(
  calendarUrl: string,
  username: string,
  password: string,
  date: string, // "YYYY-MM-DD"
  timeZone?: string, // IANA zone like "America/Los_Angeles"; if omitted, fall back to a wide UTC window
): Promise<CalDAVEvent[]> {
  const auth = basicAuth(username, password);

  let start: string;
  let end: string;
  if (timeZone) {
    // Tight window: exactly the user's local day, converted to UTC.
    // This prevents yesterday's evening occurrences (which land in today's UTC
    // early-morning hours for negative offsets) from being pulled into today.
    const bounds = localDayUtcBounds(date, timeZone);
    start = bounds.startUtc;
    end = bounds.endUtc;
  } else {
    // Legacy fallback: [today 00:00 UTC, tomorrow 23:59 UTC].
    start = toIcalDate(date);
    end = toIcalDate(addDays(date, 1), true);
  }

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

  const compact = date.replace(/-/g, ''); // "20260414"
  const nextCompact = addDays(date, 1).replace(/-/g, '');

  // Build a map: UID → set of RECURRENCE-ID dates (compact YYYYMMDD) that have
  // overrides in the response. Used to skip master-event substitution when the
  // occurrence being displayed has been rescheduled via an override.
  const overrideDatesByUid = new Map<string, Set<string>>();
  for (const ev of events) {
    if (ev.recurrenceId) {
      const ridDate = ev.recurrenceId.slice(0, 8);
      if (!overrideDatesByUid.has(ev.uid)) overrideDatesByUid.set(ev.uid, new Set());
      overrideDatesByUid.get(ev.uid)!.add(ridDate);
    }
  }

  const result: CalDAVEvent[] = [];
  for (const ev of events) {
    const startCompact = ev.dtstart.slice(0, 8);
    const isUtc = ev.dtstart.endsWith('Z');
    // "Master" = recurring event with no RECURRENCE-ID (the series definition)
    const isMaster = !!ev.isRecurring && !ev.recurrenceId;

    if (ev.isAllDay) {
      // All-day / multi-day: date must fall within [start, end)
      const endCompact = ev.dtend.slice(0, 8);
      if (startCompact <= compact && compact < endCompact) result.push(ev);
      continue;
    }

    // If a master has an override whose RECURRENCE-ID is today, the override
    // replaces today's occurrence — drop the master so we don't render both
    // (or worse, render the master at the pre-reschedule time).
    if (isMaster && overrideDatesByUid.get(ev.uid)?.has(compact)) {
      continue;
    }

    // TZID-embedded local time whose date is today: already correct.
    if (!isUtc && startCompact === compact) {
      result.push(ev);
      continue;
    }

    // UTC timestamp: use the user's timezone to determine the real local date.
    if (isUtc && timeZone) {
      const localDate = utcIcalToLocalCompact(ev.dtstart, timeZone);
      if (localDate === compact) {
        const localHHMM = utcIcalToLocalHHMM(ev.dtstart, timeZone);
        const localEndHHMM = utcIcalToLocalHHMM(ev.dtend, timeZone);
        result.push({
          ...ev,
          startTime: localHHMM ?? ev.startTime,
          endTime: localEndHHMM ?? ev.endTime,
        });
      }
      continue;
    }

    // UTC timestamp with no timezone provided: best-effort legacy behavior —
    // accept events on tomorrow's UTC day with UTC hour < 12 as "today" local.
    if (isUtc && !timeZone && startCompact === nextCompact) {
      const utcHour = parseInt(ev.dtstart.slice(9, 11), 10);
      if (utcHour < 12) {
        result.push({
          ...ev,
          dtstart: compact + ev.dtstart.slice(8),
          dtend: ev.dtend.startsWith(nextCompact)
            ? compact + ev.dtend.slice(8)
            : ev.dtend,
        });
      }
      continue;
    }

    // Recurring master with TZID-local DTSTART from a past date: the server's
    // tight time-range filter has already confirmed today has an occurrence,
    // so substitute today's date onto the master's local time.
    if (isMaster && !isUtc) {
      const sy = parseInt(startCompact.slice(0, 4), 10);
      const sm = parseInt(startCompact.slice(4, 6), 10) - 1;
      const sd = parseInt(startCompact.slice(6, 8), 10);
      const ty = parseInt(compact.slice(0, 4), 10);
      const tm = parseInt(compact.slice(4, 6), 10) - 1;
      const td = parseInt(compact.slice(6, 8), 10);
      const diffDays = Math.round(
        (Date.UTC(ty, tm, td) - Date.UTC(sy, sm, sd)) / 86_400_000
      );
      if (diffDays > 0) {
        const timePart = ev.dtstart.slice(8);
        const endTimePart = ev.dtend.slice(8);
        result.push({
          ...ev,
          dtstart: compact + timePart,
          dtend:   compact + endTimePart,
        });
        continue;
      }
    }

    // Non-matching event — skip
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
  date: string,
  timeZone?: string,
): Promise<CalDAVEvent[]> {
  const principalUrl = await discoverPrincipalUrl(serverUrl, username, password);
  const calendarHome = await getCalendarHome(principalUrl, username, password);
  const calendars = await listCalendars(calendarHome, username, password);

  const allEvents = await Promise.all(
    calendars.map(cal => fetchEventsForDate(cal.url, username, password, date, timeZone).catch(() => []))
  );

  // Flatten, then deduplicate by UID — iCloud can return the same event from
  // multiple calendars. When a master and an override both match today, prefer
  // the override so we show the actual rescheduled time.
  const flat = allEvents.flat();

  // First pass: note which UIDs have an override present.
  const hasOverride = new Set<string>();
  for (const ev of flat) {
    if (ev.recurrenceId) hasOverride.add(ev.uid);
  }

  const seen = new Set<string>();
  const result: CalDAVEvent[] = [];
  // Two-pass: emit overrides first, then non-overrides (skipping UIDs already seen).
  for (const ev of flat) {
    if (!ev.recurrenceId) continue;
    if (seen.has(ev.uid)) continue;
    seen.add(ev.uid);
    result.push(ev);
  }
  for (const ev of flat) {
    if (ev.recurrenceId) continue;
    // Drop a master if we already emitted an override for the same UID.
    if (hasOverride.has(ev.uid)) continue;
    if (seen.has(ev.uid)) continue;
    seen.add(ev.uid);
    result.push(ev);
  }
  return result;
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
