export interface TaskLibrarySeedCategory {
  name: string;
  sort_order: number;
  items: string[];
}

export const TASK_LIBRARY_SEED: TaskLibrarySeedCategory[] = [
  {
    name: 'Morning Routine',
    sort_order: 0,
    items: [
      'Wake up on time', 'Make the bed', 'Brush teeth', 'Floss', 'Wash face',
      'Shower', 'Get dressed', 'Comb / style hair', 'Skincare routine',
      'Morning prayer / devotional', 'Read Bible', 'Gratitude journal',
      'Drink a glass of water', 'Take vitamins / supplements', 'Morning medications',
      'Eat a healthy breakfast', 'Review to-do list', 'Check calendar',
      'Pack bag / prepare for the day', 'Morning walk or stretch',
      'Listen to worship music', 'Deep breathing / meditation',
      'Review goals for the day', 'Write in journal', 'Make coffee or tea',
    ],
  },
  {
    name: 'Evening Routine',
    sort_order: 1,
    items: [
      'Prepare tomorrow\'s clothes', 'Pack bag for tomorrow', 'Review the day',
      'Evening prayer', 'Read Bible / devotional', 'Write in gratitude journal',
      'Wind down — no screens 30 min before bed', 'Read a book',
      'Skincare / night lotion', 'Brush teeth', 'Floss', 'Take evening medications',
      'Set alarm', 'Charge phone', 'Tidy up living spaces', 'Run dishwasher',
      'Wipe kitchen counters', 'Pack kids\' lunches for tomorrow',
      'Check tomorrow\'s schedule', 'Lay out workout clothes',
      'Drink chamomile tea', 'Stretch or yoga before bed', 'Dim lights an hour before bed',
      'Reflect on one win from today', 'Write tomorrow\'s top 3 priorities',
    ],
  },
  {
    name: 'Faith & Spiritual Growth',
    sort_order: 2,
    items: [
      // Daily Practices
      'Morning prayer', 'Evening prayer', 'Read Bible (at least 1 chapter)',
      'Daily devotional', 'Gratitude list', 'Scripture memorization',
      'Worship music / praise', 'Listen to sermon or podcast',
      'Pray for family members', 'Pray for friends and neighbors',
      'Pray for community / nation', 'Fasting (partial or full)',
      // Weekly Practices
      'Attend Sunday church service', 'Attend midweek service',
      'Small group / Bible study', 'Family devotional', 'Tithe / offering',
      'Serve at church (volunteer)', 'Sunday school or class',
      // Growth & Community
      'Meet with mentor / pastor', 'Accountability partner check-in',
      'Read a Christian book', 'Listen to a faith podcast',
      'Journal faith reflections', 'Volunteer at church event',
      'Community outreach / service', 'Invite someone to church',
      'Write an encouraging note', 'Pray with spouse / family',
      'Memorize a Bible verse', 'Share faith with someone',
    ],
  },
  {
    name: 'Health & Wellness',
    sort_order: 3,
    items: [
      // Daily Health Basics
      'Drink 8 glasses of water', 'Take daily vitamins / supplements',
      'Morning medications', 'Evening medications',
      'Eat a nutritious breakfast', 'Eat a balanced lunch', 'Cook a healthy dinner',
      'Limit sugar and processed foods', 'Avoid late-night snacking',
      'Get 7–9 hours of sleep', 'Step outside for fresh air',
      // Exercise & Fitness
      '30-minute walk', 'Morning run or jog', 'Workout at the gym',
      'Home workout', 'Yoga session', 'Stretching routine',
      'Bike ride', 'Swim laps', 'Strength training',
      'Dance for fun', 'Play a sport', 'Walk after dinner',
      // Mental & Emotional Health
      'Meditation (10–15 min)', 'Deep breathing exercises',
      'Journal thoughts and feelings', 'Limit social media use',
      'Spend time in nature', 'Call a friend for support',
      'Take a mental health day when needed', 'Nap if exhausted (20–30 min)',
      // Medical Care
      'Schedule annual physical', 'Schedule dentist appointment',
      'Schedule eye exam', 'Refill prescriptions', 'Pick up medications',
      'Fill weekly pill organizer', 'Track symptoms / health log',
      'Attend doctor appointment', 'Attend therapy / counseling',
      'Complete blood work or labs', 'Skin cancer screening',
      // Self-Care
      'Take a relaxing bath', 'Get a massage', 'Do a face mask',
      'Manicure / pedicure', 'Unplug and rest', 'Read for pleasure',
      'Watch something uplifting', 'Spend time on a hobby',
    ],
  },
  {
    name: 'Family',
    sort_order: 4,
    items: [
      // Daily Connection
      'Family dinner together', 'Evening family devotional',
      'Read to children', 'Help kids with homework',
      'Quality time with spouse / partner', 'Date night',
      'Play with kids', 'Family walk or bike ride',
      'Pray together as a family', 'Talk about highs and lows of the day',
      // Weekly Family Rhythms
      'Family game night', 'Family movie night', 'Weekend outing or activity',
      'Family meeting (schedules, goals, issues)', 'Cook a meal together',
      'Attend kids\' sports / activities', 'Volunteer as a family',
      'Church as a family', 'Plan a fun family activity',
      // Spouse / Partner
      'Write a note of appreciation to spouse',
      'Plan a date night', 'Have a relationship check-in conversation',
      'Pray for your spouse', 'Express gratitude to your partner',
      'Put the phone away during time together',
      // Kids
      'Review kids\' schoolwork', 'Meet with teacher', 'Sign permission slips',
      'Schedule kids\' activities', 'Teach a life skill to children',
      'Talk about faith with kids', 'Celebrate milestones and wins',
      // Extended Family
      'Call parents / grandparents', 'Visit extended family',
      'Send birthday card or gift', 'Plan family reunion or gathering',
    ],
  },
  {
    name: 'Daily Household',
    sort_order: 5,
    items: [
      // Kitchen — Daily
      'Wash dishes', 'Load dishwasher', 'Run dishwasher', 'Unload dishwasher',
      'Wipe kitchen counters', 'Wipe stovetop', 'Clean microwave inside',
      'Take out kitchen trash', 'Replace trash bag', 'Sweep kitchen floor',
      'Wipe dining table', 'Store leftovers properly',
      // Tidying — Daily
      'Make the bed', 'Pick up clutter around the house', 'Put items back in their place',
      'Straighten living room', 'Fluff couch pillows', 'Clear off counters',
      'Return dishes to kitchen', 'Hang up coats and bags',
      // Laundry — Daily / As Needed
      'Put dirty clothes in hamper', 'Start a load of laundry', 'Move laundry to dryer',
      'Fold and put away laundry', 'Hang clothes in closet',
      // Bathroom — Daily
      'Wipe bathroom sink', 'Wipe bathroom counter', 'Hang up towels',
      'Quick toilet wipe-down', 'Replace toilet paper roll',
      // Pets — Daily
      'Feed pets', 'Refresh pet water', 'Walk the dog', 'Scoop litter box',
      'Pet playtime / exercise',
    ],
  },
  {
    name: 'Weekly Household',
    sort_order: 6,
    items: [
      // Kitchen — Weekly
      'Deep clean stovetop', 'Wipe down appliances (toaster, coffee maker, etc.)',
      'Wipe inside microwave thoroughly', 'Wipe refrigerator exterior',
      'Mop kitchen floor', 'Clean kitchen sink', 'Wipe cabinet fronts',
      // Bathroom — Weekly
      'Scrub toilet thoroughly', 'Scrub tub / shower', 'Clean sink and faucet',
      'Clean bathroom mirror', 'Mop bathroom floor', 'Change hand towels',
      'Wipe down bathroom counters and shelves',
      // Floors & Surfaces — Weekly
      'Vacuum all carpets and rugs', 'Sweep all hard floors', 'Mop all hard floors',
      'Dust furniture and shelves', 'Wipe light switches and doorknobs',
      'Dust ceiling fan blades', 'Wipe window sills',
      // Laundry — Weekly
      'Wash bed sheets', 'Wash towels and bath mats', 'Sort and do full laundry',
      'Clean lint trap in dryer',
      // Other Weekly
      'Empty all trash cans and replace bags', 'Take out recycling',
      'Grocery shopping', 'Meal prep for the week', 'Tidy garage or entryway',
      'Water indoor plants', 'Wipe down TV and remotes',
      'Check and toss expired food', 'Clean out car interior',
      'Wipe microwave turntable', 'Tidy junk drawer or catch-all area',
    ],
  },
  {
    name: 'Monthly Household',
    sort_order: 7,
    items: [
      // Deep Cleaning
      'Clean inside refrigerator', 'Wipe refrigerator coils / top',
      'Clean oven interior', 'Run dishwasher cleaning cycle',
      'Clean garbage disposal', 'Deep clean microwave',
      'Wash windows (inside)', 'Clean window blinds / shades',
      'Wipe baseboards', 'Dust ceiling fans', 'Clean air vents / registers',
      'Clean behind and under furniture', 'Vacuum under couch cushions',
      'Wipe down all doors and door frames',
      // Laundry & Linens
      'Wash pillows', 'Wash duvet / comforter', 'Wash shower curtain / liner',
      'Rotate and flip mattress', 'Wash mattress protector',
      // Organization
      'Declutter and donate unused items', 'Organize a closet or drawer',
      'Sort through paper clutter / mail', 'File important documents',
      'Organize pantry and check supplies', 'Clean out medicine cabinet',
      // Home Maintenance — Monthly
      'Replace HVAC / furnace filter', 'Test smoke detectors',
      'Test carbon monoxide detector', 'Check under sinks for leaks',
      'Check fire extinguisher', 'Inspect dryer vent (clean if needed)',
      'Run washing machine cleaning cycle', 'Check water softener salt',
      'Unclog slow drains', 'Check and replace burnt-out bulbs',
      'Lubricate door hinges', 'Tighten loose cabinet handles / screws',
    ],
  },
  {
    name: 'Seasonal & Yearly',
    sort_order: 8,
    items: [
      // Spring
      'Deep spring clean entire house', 'Wash all windows (inside and outside)',
      'Clean window screens', 'Wash curtains and drapes',
      'Put away winter clothes', 'Get out spring / summer clothes',
      'Service air conditioner', 'Replace HVAC filter (spring)',
      'Check roof after winter', 'Inspect attic / basement for moisture',
      'Power wash driveway and siding', 'Clean out garage',
      'Plant garden / flower beds', 'Seed bare patches in lawn',
      'Service lawn mower', 'Fertilize lawn',
      // Summer
      'Check weatherstripping on doors and windows',
      'Clean outdoor furniture', 'Inspect deck / patio',
      'Trim trees and large branches', 'Check irrigation system',
      'Touch up exterior paint', 'Clean pool and service equipment',
      // Fall
      'Rake and bag leaves', 'Clean gutters after leaf fall',
      'Put away summer clothes', 'Get out fall / winter clothes',
      'Winterize outdoor faucets and hose bibs', 'Store garden hoses',
      'Blow out irrigation system', 'Service furnace / heat',
      'Replace HVAC filter (fall)', 'Check chimney and fireplace',
      'Store outdoor furniture', 'Check roof before winter',
      'Stock emergency supplies (salt, shovels, etc.)',
      'Add weather stripping where needed', 'Inspect insulation',
      // Winter
      'Reverse ceiling fan direction (clockwise for winter)',
      'Deep clean fireplace / hearth', 'Shovel snow promptly',
      'Salt walkways and driveway', 'Check plumbing for freezing risk',
      // Yearly
      'Annual HVAC inspection / tune-up', 'Annual plumbing inspection',
      'Flush water heater', 'Inspect and clean dryer duct',
      'Check smoke and CO detector batteries', 'Fire safety walkthrough',
      'Review home insurance policy', 'Review life insurance policy',
      'Update will / estate documents', 'Review emergency plan with family',
      'Annual car inspection and registration', 'Oil change and tire rotation',
      'Dental cleaning (every 6 months)', 'Annual physical and blood work',
      'Renew subscriptions or cancel unused ones',
      'Review and update budget', 'Review investment and savings accounts',
      'Tax filing preparation', 'Organize / shred old documents',
    ],
  },
  {
    name: 'Outdoor & Yard',
    sort_order: 9,
    items: [
      // Weekly Yard Work
      'Mow the lawn', 'Edge sidewalks and driveway', 'Weed flower beds',
      'Pull weeds in garden', 'Water plants and garden', 'Water lawn if dry',
      'Sweep porch, patio, and walkways', 'Pick up yard debris / sticks',
      'Empty outdoor trash / recycling', 'Rake leaves',
      'Scoop dog waste', 'Shovel snow / salt walkways',
      // Monthly / Seasonal Yard
      'Trim hedges and shrubs', 'Prune rose bushes', 'Prune trees',
      'Apply mulch to flower beds', 'Fertilize lawn', 'Fertilize garden',
      'Treat lawn for weeds / pests', 'Aerate lawn',
      'Clean gutters and downspouts', 'Wash outdoor furniture',
      'Check and clean outdoor lighting', 'Inspect fence / gate',
      'Inspect deck / patio for damage', 'Clean and oil deck boards',
      'Check sprinkler / irrigation heads', 'Repot outdoor plants',
      // Garden
      'Plant vegetables / herbs', 'Plant seasonal flowers', 'Harvest vegetables',
      'Turn compost pile', 'Add compost to garden', 'Thin seedlings',
      'Stake tall plants / tomatoes', 'Apply pest control (organic)',
      'Deadhead flowers', 'Divide and transplant perennials',
      // Cars & Outdoor Equipment
      'Wash the car', 'Vacuum car interior', 'Clean car windows',
      'Check tire pressure', 'Oil change and fluid check',
      'Sharpen lawn mower blade', 'Service lawn mower (annual)',
      'Clean and store garden tools', 'Sharpen pruning shears',
      'Check outdoor hoses and connections', 'Power wash patio / driveway',
    ],
  },
  {
    name: 'Work & Productivity',
    sort_order: 10,
    items: [
      // Daily Work Habits
      'Review today\'s priorities (top 3)', 'Check email and respond to urgent items',
      'Time block your schedule', 'Work on most important task first',
      'Clear email inbox', 'Attend scheduled meetings',
      'Take a proper lunch break', 'Avoid unnecessary meetings',
      'Log completed tasks', 'Tidy desk before leaving work',
      'Plan tomorrow at end of day', 'Disconnect from work at set time',
      // Organization & Planning
      'Weekly planning session (Sunday or Monday)', 'Monthly goal review',
      'Review and update project list', 'Update task management system',
      'File important documents', 'Clear digital clutter (downloads, desktop)',
      'Back up important files', 'Organize email folders',
      // Professional Development
      'Read industry news or articles', 'Listen to a professional podcast',
      'Complete an online course or lesson', 'Attend a webinar',
      'Network with a colleague', 'Update LinkedIn profile',
      'Work on a professional certification', 'Read a business / leadership book',
      'Seek feedback from manager / mentor', 'Set quarterly professional goals',
      // Finance & Admin
      'Review budget', 'Track expenses', 'Pay bills on time',
      'Check bank account', 'Review credit card statement',
      'Transfer to savings', 'Review retirement / investment account',
      'Submit expense reports', 'Renew professional licenses',
    ],
  },
  {
    name: 'Personal Growth',
    sort_order: 11,
    items: [
      // Reading & Learning
      'Read a book (at least 20 pages)', 'Listen to an audiobook', 'Read the news',
      'Learn something new today', 'Complete an online course lesson',
      'Watch an educational video', 'Study a new skill',
      'Listen to an educational podcast', 'Visit the library',
      // Goal Setting & Reflection
      'Write in journal', 'Review personal goals', 'Set a new goal',
      'Track habit progress', 'Monthly personal review',
      'Write a letter to your future self', 'Celebrate a recent win',
      'Identify one area to improve', 'Define your values / priorities',
      // Creativity & Hobbies
      'Work on a creative hobby', 'Play a musical instrument',
      'Draw, paint, or create art', 'Write creatively', 'Take photographs',
      'Cook or try a new recipe', 'Start a DIY project', 'Learn a new language',
      'Complete a puzzle', 'Play chess or a strategy game',
      'Garden for joy', 'Work on a craft project',
      // Mindset & Character
      'Practice gratitude (write 3 things)', 'Do something outside your comfort zone',
      'Apologize or make amends where needed', 'Forgive someone (or yourself)',
      'Do an act of kindness', 'Mentor or encourage someone',
      'Practice patience today', 'Limit complaining for the day',
      'Put the phone down and be present', 'Speak encouraging words to yourself',
    ],
  },
  {
    name: 'Relationships & Community',
    sort_order: 12,
    items: [
      // Friendships
      'Call or text a friend', 'Schedule a coffee or lunch date',
      'Write an encouraging note or card', 'Check in on a friend who is struggling',
      'Plan a get-together', 'Remember a friend\'s birthday',
      'Send a birthday message or gift', 'Reconnect with an old friend',
      // Community & Neighbors
      'Introduce yourself to a neighbor', 'Help a neighbor in need',
      'Attend a community event', 'Join a local club or group',
      'Volunteer at a local organization', 'Support a local business',
      'Donate to a food bank or charity', 'Participate in a neighborhood clean-up',
      // Extended Family
      'Call parents or grandparents', 'Visit extended family',
      'Plan a family gathering', 'Write a letter to a relative',
      'Share a meal with family', 'Help a family member in need',
      // Church & Service
      'Serve in a church ministry', 'Sign up to volunteer', 'Help with a church event',
      'Welcome a newcomer at church', 'Bring a meal to someone in need',
      'Pray for your community', 'Support a missionary or cause',
      'Participate in community prayer', 'Organize a neighborhood Bible study',
      // Hospitality
      'Host a dinner or gathering', 'Invite someone over for a meal',
      'Bake something for a neighbor', 'Write a thank-you note',
      'Send flowers or a gift to someone', 'Drop off dinner for a family in need',
    ],
  },
  {
    name: 'Home Safety & Preparedness',
    sort_order: 13,
    items: [
      // Daily Safety
      'Lock doors before bed', 'Lock doors when leaving home',
      'Turn off stove / oven before leaving', 'Turn off lights when not in use',
      'Unplug small appliances when done', 'Check doors and windows before bed',
      // Monthly Safety
      'Test smoke detectors', 'Test carbon monoxide detectors',
      'Check fire extinguisher pressure', 'Review emergency exits',
      'Replace detector batteries (as needed)', 'Check first aid kit supplies',
      // Emergency Preparedness
      'Update emergency contact list', 'Review family emergency plan',
      'Restock emergency food / water supply', 'Check flashlights and batteries',
      'Prepare / update car emergency kit', 'Know location of water / gas shutoffs',
      'Keep important documents in a safe place', 'Update home inventory list',
      'Review homeowner\'s / renter\'s insurance', 'Have cash on hand for emergencies',
    ],
  },
  {
    name: 'Finances',
    sort_order: 14,
    items: [
      // Daily / Weekly
      'Track daily spending', 'Avoid impulse purchases (wait 24 hours)',
      'Check bank account balance', 'Review credit card transactions',
      'Log expenses in budget tracker', 'Pack lunch instead of eating out',
      // Monthly
      'Pay all bills on time', 'Pay rent / mortgage', 'Pay utilities',
      'Pay insurance premiums', 'Review subscriptions — cancel unused',
      'Transfer to emergency fund', 'Transfer to savings goal',
      'Review monthly budget vs. actuals', 'Review credit card statement',
      'Review investment / retirement account', 'Tithe / give to church or charity',
      // Quarterly / Yearly
      'Review and update household budget', 'Review insurance coverage',
      'Meet with financial advisor', 'Review retirement contributions',
      'File taxes (April deadline)', 'Prepare tax documents',
      'Review and adjust savings goals', 'Set financial goals for the year',
      'Review net worth', 'Update beneficiaries on accounts',
      'Shred old financial documents', 'Renew auto registration',
      'Negotiate bills (cable, phone, insurance)', 'Review estate planning documents',
    ],
  },
  {
    name: 'Recreation & Fun',
    sort_order: 15,
    items: [
      // Outdoor Adventures
      'Go to the beach', 'Hike a trail', 'Visit a park', 'Go fishing',
      'Go camping', 'Picnic outside', 'Bird watching', 'Stargazing',
      'Explore a new neighborhood', 'Kayaking or canoeing', 'Bike ride',
      // Sports & Activities
      'Play tennis', 'Play pickleball', 'Play basketball', 'Play golf',
      'Go running', 'Play disc golf', 'Swim at the pool', 'Mini golf',
      'Bowling', 'Go to a live sports game', 'Horseback riding',
      // Entertainment & Culture
      'See a movie', 'Visit a museum', 'Attend a concert or live show',
      'Go to the theater', 'Visit an art gallery', 'Farmers market trip',
      'Visit a botanical garden', 'Attend a local festival or fair',
      'Drive-in movie', 'Comedy show', 'Escape room',
      // At-Home Fun
      'Family game night', 'Movie marathon', 'Cook a new recipe',
      'Bake together', 'Do a puzzle', 'Play board games or card games',
      'Karaoke at home', 'Video games', 'Craft or DIY project',
      'Start a new show', 'Have a bonfire or backyard cookout',
      // Travel & Day Trips
      'Plan a vacation', 'Book a weekend trip', 'Day trip to somewhere new',
      'Road trip', 'Explore a town nearby', 'Try a new restaurant',
      'Take a scenic drive',
    ],
  },
];
