import { deepCopy } from './utils.js';

const CURRENT_VERSION = '0.2';

const allTags = {
  'once': 'Once per turn',
  'savehalf': 'Save for half',
  'triggeredsave': 'Requires Save',
  'condition': 'Applies Condition',
  'maximized': 'Maximized',
  'reroll1': 'Reroll 1s',
  'reroll2': 'Reroll 1+2s',
  'min2': 'Treat 1s as 2s.',
  'expandedcrit1': 'Crits 19-20',
  'expandedcrit2': 'Crits 18-20'
}

const allDamageTypes = [
  'slashing',
  'piercing',
  'bludgeoning',
  'fire',
  'cold',
  'lightning',
  'thunder',
  'acid',
  'poison',
  'psychic',
  'necrotic',
  'radiant',
  'force'
]

const abilityTypes = [
  "Dex",
  "Con",
  "Wis",
  "Cha",
  "Str",
  "Int"
]

const allConditions = [
  "Blinded",
  "Charmed",
  "Deafened",
  "Frightened",
  "Grappled",
  "Incapacitated",
  "Invisible",
  "Paralyzed",
  "Petrified",
  "Poisoned",
  "Prone",
  "Restrained",
  "Stunned",
  "Unconscious",
  "Exhaustion"
]

// ======================== DATA STRUCTURES =======================

const defaultDamageData = {
  dieCount: 1,
  dieType: 6,
  modifier: 0,
  damageType: 'slashing',
  name: '',
  tags: [],
  enabled: true,

  // only relevant for triggered saves
  savingThrowDC: 12,
  savingThrowType: 0, //Dex

  // only relevant for applied condition
  condition: ''
};

const defaultAttackData = {
  isActive: true,
  dieCount: 1,
  modifier: 0,
  isSavingThrow: false,
  savingThrowDC: 12,
  savingThrowType: 0, //Dex
  name: 'Longsword',
  desc: 'Reach 5ft, one target.',
  damageData: []
};

// const initialRollData = [];
// [
//   {
//     attackID: 0,
//     hit: true,
//     rollOne: 18,
//     rollTwo: 1,
//     attackBonus: 4,
//     damageRollData: [[TYPE, AMOUNT, REROLLED, DAMAGE_ID], ['fire', 6, false, 1]]
//     critRollData: [[TYPE, AMOUNT, REROLLED, DAMAGE_ID], ['fire', 6, false, 1]]
//   }, {
//     ...
//   }
// ]

const defaultAllAttackData = [
  {
    isActive: true,
    dieCount: 2,
    modifier: 4,
    isSavingThrow: false,
    savingThrowDC: 12,
    savingThrowType: 0, //Dex
    name: 'Longsword',
    desc: 'Reach 5ft, one target.',
    damageData: [
      {
        dieCount: 1,
        dieType: 8,
        modifier: 4,
        damageType: 'slashing',
        name: '',
        tags: [],
        enabled: true
      },{
        dieCount: 6,
        dieType: 6,
        modifier: 0,
        damageType: 'slashing',
        name: 'sneak attack',
        tags: ['first'],
        enabled: true
      }
    ]


  },{
    isActive: true,
    dieCount: 1,
    modifier: 6,
    isSavingThrow: false,
    savingThrowDC: 12,
    savingThrowType: 0, //Dex
    name: 'Thrown rose',
    desc: 'Reach 30ft, one target.',
    damageData: [
    {
      dieCount: 1,
      dieType: 4,
      modifier: 0,
      damageType: 'piercing',
      name: '',
      tags: [],
      enabled: true
    },{
      dieCount: 2,
      dieType: 6,
      modifier: 0,
      damageType: 'fire',
      name: 'flaming',
      tags: ['reroll2'],
      enabled: true
    }]
  }
];

const defaultCharacterList = [
  {
    id: 123456,
    name: 'Tuxedo Mask',
    allAttackData: deepCopy(defaultAllAttackData)
  },
  {
    id: 654321,
    name: 'Makato Kino',
    allAttackData: deepCopy(defaultAllAttackData)
  }
]


// ======================== SAVE / LOAD TO LOCALSTORAGE =======================

function getCharacterStorageName(id, name) {
  return `character-${id}-${name}`;
}

function getCharacterNameFromStorageName(storageName) {
  return storageName.slice(17); // cuts out the "character-XXXXXX-"
}

function getCharacterIDFromStorageName(storageName) {
  return parseInt(storageName.slice(10,16)); // cuts out the "character-" and "-NAME"
}

function saveCharacterData(id, newName, newAllAttackData) {
  console.log('saving character ', newName, '   ', id);

  const characterData = {
    id: id,
    name: newName,
    allAttackData: newAllAttackData
  }

  const storageName = getCharacterStorageName(id, newName);
  localStorage.setItem(storageName, JSON.stringify(characterData));
  localStorage.setItem("version", CURRENT_VERSION);

  // has the name changed? if so, delete the old one
  for ( var i = 0, len = localStorage.length; i < len; ++i ) {
    const key = localStorage.key(i);
    if (key && key.startsWith('character-')) {
      const characterID = getCharacterIDFromStorageName(key)
      const characterName = getCharacterNameFromStorageName(key)

      if (characterID === id && characterName !== newName) {
        console.log('Character name changed from "',characterName,'" to "',newName,'"; updating key names');
        localStorage.removeItem(key)
      }
    }
  }
}

function loadCharacterData(id) {
  // find the key with this ID
  let storageName = null;
  for ( var i = 0, len = localStorage.length; i < len; ++i ) {
    const key = localStorage.key(i);
    const characterID = getCharacterIDFromStorageName(key)
    if (characterID === id) {
      storageName = key;
    }
  }

  // load up that character's data and set it to be active
  if (storageName) {
    const loadedCharacter = localStorage.getItem(storageName);

    if (loadedCharacter) {
      const characterData = JSON.parse(loadedCharacter);
      return characterData;
    }
  }

  console.log('Tried to load character id [', id, '], but failed!');
  return null;
}

// generates a random 6-digit int from 100000 to 999999
function getRandomFingerprint() {
  let rand = Math.random();
  rand = rand * 899999
  rand = rand + 100000
  return Math.floor(rand)
}

export {
  CURRENT_VERSION,
  allTags,
  allDamageTypes,
  abilityTypes,
  allConditions,
  defaultDamageData,
  defaultAttackData,
  defaultAllAttackData,
  defaultCharacterList,
  loadCharacterData,
  saveCharacterData,
  getCharacterNameFromStorageName,
  getCharacterIDFromStorageName,
  getRandomFingerprint,
};
