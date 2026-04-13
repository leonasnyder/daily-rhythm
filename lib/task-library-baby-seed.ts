export interface TaskLibrarySeedCategory {
  name: string;
  sort_order: number;
  items: string[];
}

export const BABY_TASK_LIBRARY_SEED: TaskLibrarySeedCategory[] = [
  {
    name: 'Newborn Care (0–3 months)',
    sort_order: 0,
    items: [
      // Feeding
      'Breastfeed (every 2–3 hrs)', 'Bottle feed', 'Burp after feeding',
      'Track feeding times and amounts', 'Pump breast milk', 'Store breast milk',
      'Prepare formula', 'Clean and sterilize bottles',
      // Diapering
      'Diaper change', 'Check for diaper rash', 'Apply diaper cream',
      'Track wet and dirty diapers',
      // Sleep
      'Swaddle baby', 'Put baby down on back to sleep', 'White noise machine on',
      'Monitor baby on sleep monitor', 'Nap time routine',
      // Health & Hygiene
      'Sponge bath', 'Clean umbilical cord stump', 'Trim fingernails',
      'Clean baby\'s eyes and nose', 'Take temperature if fussy',
      'Vitamin D drops', 'Track growth and weight',
      // Development
      'Tummy time (start with 1–2 min)', 'Talk and sing to baby',
      'Skin-to-skin time', 'Read aloud to baby',
      // Parent Self-Care
      'Sleep when baby sleeps', 'Eat a meal', 'Drink water',
      'Ask for help from partner or family', 'Take a shower',
    ],
  },
  {
    name: 'Infant Care (3–6 months)',
    sort_order: 1,
    items: [
      // Feeding
      'Breastfeed or bottle feed', 'Track feeding schedule',
      'Introduce first solid foods (around 6 months)', 'Offer water sips (after 6 months)',
      'Burp after feeding', 'Watch for food allergy signs',
      // Diapering
      'Diaper change', 'Apply diaper cream as needed',
      // Sleep
      'Establish nap routine', 'Bedtime routine', 'Swaddle or sleep sack',
      'Put down drowsy but awake', 'White noise', 'Dream feed before midnight',
      // Development
      'Tummy time (increase to 20–30 min/day)', 'Talk and narrate your day',
      'Sing nursery rhymes', 'Read board books', 'Play with high-contrast toys',
      'Mirror play', 'Practice sitting with support', 'Shake rattle / sensory toys',
      // Hygiene
      'Bath time (2–3x per week)', 'Baby massage after bath',
      'Trim fingernails and toenails', 'Brush gums with soft cloth',
      // Health
      'Track growth — weight and length', 'Pediatrician checkup',
      'Vaccinations per schedule', 'Vitamin D drops',
    ],
  },
  {
    name: 'Baby Care (6–12 months)',
    sort_order: 2,
    items: [
      // Feeding
      'Morning nursing or bottle', 'Breakfast solids', 'Lunch solids',
      'Dinner solids', 'Offer water in sippy cup', 'Evening nursing or bottle',
      'Introduce new foods one at a time', 'Try purees — vegetables',
      'Try purees — fruits', 'Try soft finger foods', 'Practice self-feeding',
      'Watch for choking hazards', 'Avoid honey under 1 year',
      // Sleep
      'Morning nap', 'Afternoon nap', 'Bedtime routine',
      'Bath → pajamas → book → song → bed', 'Consistent bedtime (7–8 PM)',
      // Development
      'Tummy time and crawling practice', 'Supported standing practice',
      'Peek-a-boo', 'Wave bye-bye', 'Clap hands together',
      'Read books together', 'Sing songs', 'Play with stacking toys',
      'Practice picking up small objects (pincer grasp)',
      'Talk and label everything around them', 'Baby-proof the home',
      // Hygiene
      'Daily bath or wipe-down', 'Brush first teeth with soft brush',
      'Trim nails', 'Clean ears gently',
      // Health
      'Pediatrician 6-month checkup', 'Pediatrician 9-month checkup',
      'Pediatrician 12-month checkup', 'Vaccinations per schedule',
      'Track growth — weight, height, head circumference',
    ],
  },
  {
    name: 'Toddler Care (1–2 years)',
    sort_order: 3,
    items: [
      // Feeding
      'Breakfast', 'Morning snack', 'Lunch', 'Afternoon snack', 'Dinner',
      'Offer milk (whole milk after 12 months)', 'Offer water throughout the day',
      'Try new foods — don\'t give up after one refusal',
      'Avoid choking hazards (grapes, nuts, popcorn)',
      'Limit juice and sugary drinks', 'Practice using a spoon and fork',
      // Sleep
      'Nap (1–2 naps / day)', 'Consistent bedtime routine',
      'Bath → pajamas → brush teeth → books → bed',
      'Bedtime between 7–8 PM', 'Toddler clock or nightlight',
      // Development & Play
      'Read books together (10–15 min)', 'Sing songs and nursery rhymes',
      'Play outside daily', 'Sandbox or water play',
      'Building blocks or stacking', 'Simple puzzles',
      'Drawing with crayons', 'Play dough',
      'Dance and movement', 'Pretend play',
      'Practice walking on different surfaces',
      'Teach body parts (nose, ears, eyes)',
      'Teach animal sounds', 'Name colors and shapes',
      // Language
      'Narrate daily activities to build vocabulary',
      'Read picture books and point to objects',
      'Encourage two-word phrases', 'Limit screen time (under 2: none except video calls)',
      // Hygiene
      'Diaper change / early potty introduction', 'Bath time',
      'Brush teeth (morning and night)', 'Wash hands before meals and after outside',
      'Sunscreen before outdoor play',
      // Health
      'Pediatrician 15-month checkup', 'Pediatrician 18-month checkup',
      'Pediatrician 2-year checkup', 'Vaccinations per schedule',
      'Dental checkup (first visit by age 1)',
      // Safety
      'Baby-proof low cabinets', 'Outlet covers in place',
      'Gate at top and bottom of stairs', 'Secure furniture to walls',
      'Check car seat fit and installation',
    ],
  },
  {
    name: 'Toddler Care (2–3 years)',
    sort_order: 4,
    items: [
      // Feeding
      'Breakfast', 'Morning snack', 'Lunch', 'Afternoon snack', 'Dinner',
      'Offer variety of fruits and vegetables', 'Involve toddler in simple food prep',
      'Practice pouring with small pitcher', 'Use real plates and cups',
      // Sleep
      'Nap (1–2 hours in afternoon)', 'Bedtime routine — 20–30 min',
      'Bath → pajamas → brush teeth → 2 books → lights out',
      'Consistent bedtime 7:30–8 PM', 'Toddler-proof bedroom for safe sleeping',
      // Potty Training
      'Introduce potty chair', 'Sit on potty morning and before bed',
      'Watch for potty cues', 'Celebrate successes', 'Practice pulling pants up and down',
      'Remind every 1–2 hours', 'Switch to training pants',
      'Reward chart for potty success', 'Stay calm about accidents',
      // Development & Learning
      'Read together daily (15–20 min)', 'Count objects together (1–10)',
      'Practice ABC song', 'Name and match colors',
      'Simple shape sorting', 'Draw and color freely',
      'Play pretend (kitchen, doctor, store)', 'Puzzles (6–12 pieces)',
      'Play with other children (parallel play)', 'Learn to take turns',
      'Practice saying please and thank you', 'Name emotions — happy, sad, mad, scared',
      // Outdoor & Gross Motor
      'Outdoor play — minimum 60 min/day', 'Ride balance bike or tricycle',
      'Kick and throw a ball', 'Jump with both feet', 'Climb on playground equipment',
      'Run, hop, dance', 'Sidewalk chalk',
      // Hygiene
      'Bath time', 'Brush teeth morning and night (with help)',
      'Wash hands independently with reminders', 'Wipe face after meals',
      // Health
      'Pediatrician 2.5-year checkup', 'Pediatrician 3-year checkup',
      'Dental checkup every 6 months', 'Eye checkup',
      // Emotional & Social
      'Consistent daily routine for security', 'Name and validate emotions',
      'Practice deep breaths when upset', 'Read books about feelings',
      'Limit screen time (1 hr/day max, high quality)',
    ],
  },
  {
    name: 'Preschooler Care (3–5 years)',
    sort_order: 5,
    items: [
      // Daily Routine
      'Wake up and get dressed independently', 'Brush teeth with supervision',
      'Eat breakfast', 'Pack preschool bag', 'Preschool or structured play time',
      'Outdoor play', 'Quiet time or nap', 'Afternoon snack',
      'Family dinner', 'Bath time', 'Bedtime routine — books and prayer',
      // Learning & School Readiness
      'Practice writing name', 'Practice writing letters A–Z',
      'Count to 20 and beyond', 'Identify numbers 1–10',
      'Name all colors and basic shapes', 'Match uppercase and lowercase letters',
      'Read together (20–30 min)', 'Library storytime',
      'Practice scissors and cutting skills', 'Gluing and craft projects',
      'Simple dot-to-dot and mazes', 'Learn days of the week',
      'Learn months of the year', 'Talk about seasons and weather',
      'Learn home address and parent phone number',
      // Independence Skills
      'Put on and take off shoes', 'Dress and undress independently',
      'Use toilet independently', 'Wash hands independently',
      'Help set the table', 'Help clear dishes after meals',
      'Put toys away after play', 'Make bed with help',
      'Help feed pets', 'Help with simple chores',
      // Social & Emotional
      'Playdates with peers', 'Practice sharing and taking turns',
      'Name and express emotions with words', 'Practice problem solving',
      'Role play different scenarios', 'Talk about kindness and empathy',
      'Pray together as a family', 'Bible stories for kids',
      'Teach about God\'s love', 'Memorize a simple Bible verse',
      // Gross Motor & Play
      'Outdoor play — at least 60 min/day', 'Ride bike with training wheels',
      'Throw and catch a ball', 'Hop on one foot', 'Skip and gallop',
      'Swing at the park', 'Dance and movement breaks',
      'Swimming lessons', 'Organized sports intro (soccer, gymnastics)',
      // Health
      'Pediatrician 4-year checkup', 'Pediatrician 5-year checkup',
      'Dental checkup every 6 months', 'Eye exam', 'Hearing test',
      'Vaccinations — kindergarten boosters',
      // Screen Time & Media
      'Limit screens to 1 hr/day', 'Watch together and discuss',
      'Choose educational and age-appropriate content',
      // Faith & Character
      'Morning prayer together', 'Bedtime prayer', 'Read children\'s Bible',
      'Talk about being kind, honest, and grateful',
      'Serve others as a family (bring meals, help neighbors)',
    ],
  },
  {
    name: 'Baby & Toddler Gear Maintenance',
    sort_order: 6,
    items: [
      // Daily Cleaning
      'Wash bottles and nipples', 'Sterilize bottles (newborn stage)',
      'Wipe down high chair tray', 'Wash bibs', 'Wash cloth diapers if using',
      'Wipe down changing pad', 'Wash lovey or comfort item',
      // Weekly
      'Wash crib sheets', 'Wash sleep sack or swaddles',
      'Clean and sanitize pacifiers', 'Wash bath toys',
      'Wipe down stroller', 'Wipe down car seat straps',
      'Wash baby carrier / wrap', 'Clean diaper bag',
      'Wipe down all plastic toys', 'Wash stuffed animals',
      // Monthly / As Needed
      'Deep clean high chair (remove tray and wash all crevices)',
      'Wash car seat cover', 'Inspect car seat for expiration date',
      'Clean and inspect stroller wheels and frame',
      'Rotate toy bins to keep things fresh',
      'Donate outgrown clothes and gear',
      'Check clothing sizes and update wardrobe',
      'Check baby-proofing as baby becomes more mobile',
      'Replace worn pacifiers and bottle nipples',
      'Stock diaper bag with fresh supplies',
    ],
  },
  {
    name: 'Postpartum Parent Care',
    sort_order: 7,
    items: [
      // Physical Recovery
      'Rest whenever possible', 'Stay hydrated — drink water constantly',
      'Eat nourishing meals (ask for help with this)',
      'Take postpartum vitamins / continue prenatal vitamins',
      'Peri bottle rinse after bathroom (first weeks)',
      'Ice pack or sitz bath for perineal recovery',
      'Wear comfortable, supportive clothing',
      '6-week postpartum OB appointment',
      'Follow up if symptoms of infection or complications',
      // Mental Health
      'Check in with yourself emotionally daily',
      'Talk to partner about how you\'re feeling',
      'Watch for signs of postpartum depression',
      'Reach out to doctor if feeling overwhelmed or hopeless',
      'Accept help when offered', 'Lower expectations for yourself',
      'Connect with other new parents', 'Join a new mom / dad group',
      // Practical
      'Sleep when baby sleeps (even short naps count)',
      'Let partner take a full night shift',
      'Ask family to help with meals and housework',
      'Prepare freezer meals before baby arrives',
      'Set up a feeding station (water, snacks, phone charger)',
      'Stock bathroom with postpartum supplies',
      'Prepare diaper changing stations on each floor',
      // Relationship
      'Check in with your partner daily', 'Express gratitude to each other',
      'Divide nighttime duties fairly', 'Plan a short date once cleared',
      'Pray together as a couple', 'Read a parenting book together',
    ],
  },
];
