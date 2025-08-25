const PROFANITY_WORDS = [
  '2g1c',
  '2 girls 1 cup',
  'acrotomophilia',
  'alabama hot pocket',
  'alaskan pipeline',
  'anal',
  'anilingus',
  'anus',
  'arsehole',
  'asshole',
  'assmunch',
  'auto erotic',
  'autoerotic',
  'babeland',
  'baby batter',
  'baby juice',
  'ball gag',
  'ball gravy',
  'ball kicking',
  'ball licking',
  'ball sack',
  'ball sucking',
  'bangbros',
  'bangbus',
  'bareback',
  'barely legal',
  'barenaked',
  'bastard',
  'bastardo',
  'bastinado',
  'bbw',
  'bdsm',
  'beaner',
  'beaners',
  'beaver cleaver',
  'beaver lips',
  'beastiality',
  'bestiality',
  'big black',
  'big breasts',
  'big knockers',
  'big tits',
  'bimbos',
  'birdlock',
  'bitch',
  'bitches',
  'black cock',
  'blonde action',
  'blonde on blonde action',
  'blowjob',
  'blow job',
  'blow your load',
  'blue waffle',
  'blumpkin',
  'bollocks',
  'bondage',
  'boner',
  'brown showers',
  'brunette action',
  'bukkake',
  'bulldyke',
  'bullet vibe',
  'bung hole',
  'bunghole',
  'busty',
  'camel toe',
  'camgirl',
  'camslut',
  'camwhore',
  'carpet muncher',
  'carpetmuncher',
  'chocolate rosebuds',
  'cialis',
  'circlejerk',
  'cleveland steamer',
  'clit',
  'clitoris',
  'clover clamps',
  'cock',
  'cocks',
  'coprolagnia',
  'coprophilia',
  'cornhole',
  'coon',
  'coons',
  'creampie',
  'cum',
  'cumming',
  'cumshot',
  'cumshots',
  'cunnilingus',
  'cunt',
  'darkie',
  'date rape',
  'daterape',
  'deep throat',
  'deepthroat',
  'dendrophilia',
  'dildo',
  'dingleberry',
  'dingleberries',
  'dirty pillows',
  'dirty sanchez',
  'dolcett',
  'domination',
  'dominatrix',
  'dommes',
  'donkey punch',
  'double dong',
  'double penetration',
  'dp action',
  'dvda',
  'eat my ass',
  'ecchi',
  'ejaculation',
  'erotism',
  'eunuch',
  'fag',
  'faggot',
  'fecal',
  'felch',
  'fellatio',
  'feltch',
  'female squirting',
  'femdom',
  'figging',
  'fingerbang',
  'fingering',
  'fisting',
  'foot fetish',
  'footjob',
  'frotting',
  'fuck buttons',
  'fucktards',
  'fudge packer',
  'fudgepacker',
  'futanari',
  'gangbang',
  'gang bang',
  'gay sex',
  'genitals',
  'giant cock',
  'girl on',
  'girl on top',
  'girls gone wild',
  'goatcx',
  'goatse',
  'god damn',
  'gokkun',
  'golden shower',
  'goodpoop',
  'goo girl',
  'goregasm',
  'grope',
  'group sex',
  'g-spot',
  'guro',
  'hand job',
  'handjob',
  'hard core',
  'hardcore',
  'hentai',
  'homoerotic',
  'honkey',
  'hooker',
  'horny',
  'incest',
  'intercourse',
  'jack off',
  'jail bait',
  'jailbait',
  'jelly donut',
  'jigaboo',
  'jiggaboo',
  'jiggerboo',
  'jizz',
  'juggs',
  'kike',
  'kinbaku',
  'kinkster',
  'kinky',
  'knobbing',
  'livesex',
  'lolita',
  'male squirting',
  'masturbate',
  'masturbating',
  'masturbation',
  'menage a trois',
  'milf',
  'missionary position',
  'mong',
  'mound of venus',
  'mr hands',
  'muff diver',
  'muffdiving',
  'nambla',
  'nawashi',
  'negro',
  'neonazi',
  'nigga',
  'nigger',
  'nig nog',
  'nimphomania',
  'nsfw images',
  'nutten',
  'nympho',
  'nymphomania',
  'omorashi',
  'one cup two girls',
  'one guy one jar',
  'orgasm',
  'orgy',
  'paedophile',
  'paki',
  'pedobear',
  'pedophile',
  'pegging',
  'pikey',
  'piss pig',
  'pisspig',
  'pleasure chest',
  'pole smoker',
  'ponyplay',
  'poof',
  'poon',
  'poontang',
  'punany',
  'poop chute',
  'poopchute',
  'porn',
  'porno',
  'pornography',
  'prince albert piercing',
  'pthc',
  'pubes',
  'pussy',
  'queaf',
  'queef',
  'quim',
  'raghead',
  'raging boner',
  'rape',
  'raping',
  'rapist',
  'rectum',
  'reverse cowgirl',
  'rimjob',
  'rimming',
  'rosy palm',
  'rosy palm and her 5 sisters',
  'rusty trombone',
  'sadism',
  'santorum',
  'scat',
  'schlong',
  'scissoring',
  'semen',
  'sexcam',
  'sexo',
  'shaved beaver',
  'shaved pussy',
  'shemale',
  'shibari',
  'shitblimp',
  'shota',
  'shrimping',
  'skeet',
  'slanteye',
  'snowballing',
  'sodomize',
  'sodomy',
  'spic',
  'splooge',
  'splooge moose',
  'spooge',
  'spread legs',
  'spunk',
  'strap on',
  'strapon',
  'strappado',
  'style doggy',
  'suicide girls',
  'sultry women',
  'swastika',
  'swinger',
  'tainted love',
  'tea bagging',
  'threesome',
  'throating',
  'thumbzilla',
  'tight white',
  'tongue in a',
  'tosser',
  'towelhead',
  'tranny',
  'tribadism',
  'tub girl',
  'tubgirl',
  'tushy',
  'twat',
  'twink',
  'twinkie',
  'two girls one cup',
  'undressing',
  'upskirt',
  'urethra play',
  'urophilia',
  'vagina',
  'venus mound',
  'viagra',
  'vibrator',
  'violet wand',
  'vorarephilia',
  'voyeur',
  'voyeurweb',
  'voyuer',
  'vulva',
  'wetback',
  'white power',
  'whore',
  'worldsex',
  'wrapping men',
  'wrinkled starfish',
  'yaoi',
  'yellow showers',
  'yiffy',
  'zoophilia'
];
const PROFANITY_LIST = new Set(PROFANITY_WORDS.map((w) => w.toLowerCase()));

// Precompiled regexes
const URL_REGEX = /(https?:\/\/|www\.)|([\w-]+\.(com|net|org|io|co|app|gg|dev|info|ai)(\b|\/))/i;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}\b/;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/;
const CC_LIKE_REGEX = /\b(?:\d[ -]?){13,19}\b/;

export function normalizeText(input) {
  if (typeof input !== 'string') return '';
  try {
    // NFKC normalization collapses many unicode confusables
    input = input.normalize('NFKC');
  } catch {}
  // Collapse whitespace
  return input.trim().replace(/\s+/g, ' ');
}

export function containsUrl(text) {
  return URL_REGEX.test(text);
}

export function containsEmail(text) {
  return EMAIL_REGEX.test(text);
}

export function containsPhone(text) {
  return PHONE_REGEX.test(text);
}

export function containsSSN(text) {
  return SSN_REGEX.test(text);
}

export function containsCreditCardLike(text) {
  return CC_LIKE_REGEX.test(text);
}

function basicLeetToAscii(text) {
  return text
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't');
}

function collapseRepeats(str) {
  return str.replace(/([a-z])\1{1,}/g, '$1');
}

export function containsProfanity(text) {
  if (!text) return false;
  // Check per-token (within words) and combined (catches spaced or dotted variants)
  const tokens = text.split(/\s+/);

  const checkCandidate = (candidate) => {
    const cleaned = collapseRepeats(
      basicLeetToAscii(candidate).replace(/[^a-z]/g, '')
    );
    if (!cleaned) return false;
    for (const slur of PROFANITY_LIST) {
      if (cleaned.includes(slur)) return true;
    }
    return false;
  };

  // Token-wise
  for (const t of tokens) {
    if (checkCandidate(t)) return true;
  }

  // Combined characters (removes all separators and spaces)
  const combined = collapseRepeats(
    basicLeetToAscii(text).replace(/[^a-z]/g, '')
  );
  if (combined) {
    for (const slur of PROFANITY_LIST) {
      if (combined.includes(slur)) return true;
    }
  }
  return false;
}

export function sanitizeClue(input) {
  return normalizeText(input);
}

export function validateClue(input) {
  const value = sanitizeClue(input);
  const reasons = [];

  if (!value) {
    reasons.push('empty');
  }
  if (value.length > 140) {
    reasons.push('length');
  }
  if (containsUrl(value)) {
    reasons.push('url');
  }
  if (containsEmail(value) || containsPhone(value) || containsSSN(value) || containsCreditCardLike(value)) {
    reasons.push('pii');
  }
  if (containsProfanity(value)) {
    reasons.push('profanity');
  }

  return {
    valid: reasons.length === 0,
    value,
    reasons
  };
}


