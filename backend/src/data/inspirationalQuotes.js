/**
 * Inspirational Quotes Database
 * Role-specific motivational quotes for personalized dashboard welcome messages
 */

export const quotes = {
  'Full Stack Developer': [
    "The best error message is the one that never shows up. - Thomas Fuchs",
    "Make it work, make it right, make it fast. - Kent Beck",
    "Code is like humor. When you have to explain it, it's bad. - Cory House",
    "First, solve the problem. Then, write the code. - John Johnson",
    "The only way to learn a new programming language is by writing programs in it. - Dennis Ritchie"
  ],
  'Backend Developer': [
    "Simplicity is the soul of efficiency. - Austin Freeman",
    "Make it work, then make it beautiful, then if you really, really have to, make it fast. - Joe Armstrong",
    "The best performance improvement is the transition from the nonworking state to the working state. - John Ousterhout",
    "Always code as if the guy who ends up maintaining your code will be a violent psychopath. - Martin Golding",
    "Programs must be written for people to read, and only incidentally for machines to execute. - Harold Abelson"
  ],
  'Frontend Developer': [
    "Design is not just what it looks like and feels like. Design is how it works. - Steve Jobs",
    "The details are not the details. They make the design. - Charles Eames",
    "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away. - Antoine de Saint-Exupéry",
    "Good design is obvious. Great design is transparent. - Joe Sparano",
    "Simplicity is the ultimate sophistication. - Leonardo da Vinci"
  ],
  'DevOps Engineer': [
    "If you automate a mess, you get an automated mess. - Rod Michael",
    "Infrastructure as code is not optional, it's mandatory. - Kief Morris",
    "The goal of automation is not to replace humans but to amplify their abilities. - Unknown",
    "Configuration management and infrastructure as code are the foundation of DevOps. - Gene Kim",
    "Without automation, DevOps is just a dream. - Anonymous"
  ],
  'Data Engineer': [
    "Data is the new oil. - Clive Humby",
    "Without big data analytics, companies are blind and deaf, wandering out onto the web like deer on a freeway. - Geoffrey Moore",
    "The goal is to turn data into information, and information into insight. - Carly Fiorina",
    "In God we trust. All others must bring data. - W. Edwards Deming",
    "Data beats emotions. - Sean Rad"
  ],
  'Machine Learning Engineer': [
    "Artificial Intelligence is the new electricity. - Andrew Ng",
    "Machine learning is the last invention that humanity will ever need to make. - Nick Bostrom",
    "The real question is, when will we draft an artificial intelligence bill of rights? - Gray Scott",
    "AI is probably the most important thing humanity has ever worked on. - Sundar Pichai",
    "Machine intelligence is the last invention that humanity will ever need to make. - Nick Bostrom"
  ],
  'Mobile Developer': [
    "Mobile is the future, and there's no such thing as communication overload. - Eric Schmidt",
    "The future of mobile is the future of online. - Matt Murphy",
    "Design is not just what it looks like and feels like. Design is how it works. - Steve Jobs",
    "The best mobile experience is invisible. - Luke Wroblewski",
    "Mobile is becoming not only the new digital hub but also the bridge to the physical world. - Thomas Husson"
  ],
  'QA Engineer': [
    "Quality is not an act, it is a habit. - Aristotle",
    "Testing leads to failure, and failure leads to understanding. - Burt Rutan",
    "The bitterness of poor quality remains long after the sweetness of low price is forgotten. - Benjamin Franklin",
    "If you don't like testing your product, most likely your customers won't like to test it either. - Anonymous",
    "Quality is never an accident; it is always the result of high intention. - John Ruskin"
  ],
  'Cloud Architect': [
    "The cloud is about how you do computing, not where you do computing. - Paul Maritz",
    "Cloud computing is a great euphemism for centralization of computer services under one server. - Evgeny Morozov",
    "In the cloud, no one can hear you scream. - Anonymous",
    "The cloud is for everyone. The cloud is a democracy. - Marc Benioff",
    "Cloud is about building platforms. - Satya Nadella"
  ],
  'Software Engineer': [
    "The best way to predict the future is to invent it. - Alan Kay",
    "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. - Martin Fowler",
    "First, solve the problem. Then, write the code. - John Johnson",
    "Code is like humor. When you have to explain it, it's bad. - Cory House",
    "Simplicity is the soul of efficiency. - Austin Freeman"
  ],
  'Data Scientist': [
    "In God we trust. All others must bring data. - W. Edwards Deming",
    "Data is not information, information is not knowledge, knowledge is not understanding, understanding is not wisdom. - Clifford Stoll",
    "Without data you're just another person with an opinion. - W. Edwards Deming",
    "The goal is to turn data into information, and information into insight. - Carly Fiorina",
    "Data scientists are the new rock stars. - Unknown"
  ]
};

// General motivational quotes (fallback)
export const generalQuotes = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Innovation distinguishes between a leader and a follower. - Steve Jobs",
  "Stay hungry. Stay foolish. - Steve Jobs",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "The only impossible journey is the one you never begin. - Tony Robbins",
  "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
  "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "Believe you can and you're halfway there. - Theodore Roosevelt"
];

// Welcome messages by time of day
export const welcomeMessages = {
  morning: [
    "Good morning, {name}! Ready to code something amazing today?",
    "Rise and shine, {name}! Let's build something great today.",
    "Morning, {name}! Time to turn coffee into code.",
    "Good morning, {name}! Your future is waiting to be coded.",
    "Hey {name}! Let's make today count."
  ],
  afternoon: [
    "Good afternoon, {name}! Keep up the great work!",
    "Afternoon, {name}! You're doing amazing!",
    "Hey {name}! Hope your day is as productive as your code is clean.",
    "Good afternoon, {name}! Remember to take breaks!",
    "Welcome back, {name}! Let's continue building awesome things."
  ],
  evening: [
    "Good evening, {name}! Wrapping up or getting started?",
    "Evening, {name}! Still crushing it, I see.",
    "Hey {name}! Burning the midnight oil?",
    "Good evening, {name}! Your dedication is inspiring.",
    "Welcome back, {name}! Let's finish strong today."
  ],
  night: [
    "Working late, {name}? Don't forget to rest!",
    "Hey {name}! Even the best developers need sleep.",
    "Late night coding, {name}? Make sure to stay hydrated!",
    "Hello {name}! Remember, bugs will still be there tomorrow.",
    "Welcome back, {name}! Don't stay up too late."
  ]
};

// Achievement messages based on profile completeness
export const achievementMessages = [
  "Your profile is {completeness}% complete. Keep going!",
  "You're {completeness}% there! Just a few more details.",
  "Awesome! Your profile is {completeness}% complete.",
  "Profile looking good at {completeness}%!",
  "{completeness}% profile completion - great progress!"
];

/**
 * Get quote by role
 */
export function getQuoteByRole(role) {
  const roleQuotes = quotes[role] || generalQuotes;
  const randomIndex = Math.floor(Math.random() * roleQuotes.length);
  return roleQuotes[randomIndex];
}

/**
 * Get daily quote (same quote for the whole day based on date)
 */
export function getDailyQuote(role) {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  
  const roleQuotes = quotes[role] || generalQuotes;
  const index = dayOfYear % roleQuotes.length;
  
  return roleQuotes[index];
}

/**
 * Get welcome message based on time of day
 */
export function getWelcomeMessage(name) {
  const hour = new Date().getHours();
  let timeOfDay;
  
  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
  } else if (hour >= 17 && hour < 22) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'night';
  }
  
  const messages = welcomeMessages[timeOfDay];
  const randomIndex = Math.floor(Math.random() * messages.length);
  
  return messages[randomIndex].replace('{name}', name);
}

/**
 * Get achievement message
 */
export function getAchievementMessage(completeness) {
  const randomIndex = Math.floor(Math.random() * achievementMessages.length);
  return achievementMessages[randomIndex].replace('{completeness}', completeness);
}

/**
 * Get personalized dashboard message
 */
export function getPersonalizedMessage(name, role, profileCompleteness) {
  const welcome = getWelcomeMessage(name);
  const quote = getDailyQuote(role);
  const achievement = profileCompleteness < 100 ? getAchievementMessage(profileCompleteness) : null;
  
  return {
    welcome,
    quote,
    achievement,
    timeOfDay: new Date().getHours() >= 5 && new Date().getHours() < 12 ? 'morning' : 
               new Date().getHours() >= 12 && new Date().getHours() < 17 ? 'afternoon' :
               new Date().getHours() >= 17 && new Date().getHours() < 22 ? 'evening' : 'night'
  };
}

export default {
  getQuoteByRole,
  getDailyQuote,
  getWelcomeMessage,
  getAchievementMessage,
  getPersonalizedMessage,
  quotes,
  generalQuotes,
  welcomeMessages
};
