

// ======================== SAVE / LOAD TO LOCALSTORAGE =======================

function getStorageName(prefix, id, name) {
  return `${prefix}-${id}-${name}`;
}

// cuts out the "crafter-XXXXXX-"
function getNameFromStorageName(prefix, storageName) {
  const precedingLength = prefix.length + 8;
  return String(storageName).slice(precedingLength);
}

// cuts out the "character-" and "-NAME"
function getIDFromStorageName(prefix, storageName) {
  const precedingLength = prefix.length + 1;
  return String(storageName).slice(precedingLength, precedingLength+6);
}

function saveLocalData(prefix, id, newName, localData) {
  if (id <= 0 || newName.length <= 0) {
    return null;
  }
  console.log('saving', prefix, newName, '   ', id);

  const storageName = getStorageName(prefix, id, newName);
  localStorage.setItem(storageName, JSON.stringify(localData));

  // has the name changed? if so, delete the old one
  for ( var i = 0, len = localStorage.length; i < len; ++i ) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${prefix}-`)) {
      const localID = getIDFromStorageName(prefix, key)
      const localName = getNameFromStorageName(prefix, key)

      if (String(localID) === String(id) && localName !== newName) {
        console.log('name changed from "',localName,'" to "',newName,'"; updating key names');
        localStorage.removeItem(key)
      }
    }
  }
}

function loadLocalData(prefix, id) {
  let stringedID = String(id)

  // find the key with this ID
  let storageName = null;
  for ( var i = 0, len = localStorage.length; i < len; ++i ) {
    const key = localStorage.key(i);
    const localID = getIDFromStorageName(prefix, key)
    if (localID === stringedID) {
      console.log('found id for', storageName);
      storageName = key;
    }
  }

  // load up that local data
  if (storageName) {
    const loadedData = localStorage.getItem(storageName);

    if (loadedData) {
      return JSON.parse(loadedData);;
    }
  }

  console.log('Tried to load',prefix,'   id [', stringedID, '], but failed!');
  return null;
}

// generates a random 6-digit int from 200000 to 999999 (monster IDs are ordered)
function getRandomFingerprint() {
  let rand = Math.random();
  rand = rand * 799999
  rand = rand + 200000
  return Math.floor(rand)
}

export {
  loadLocalData,
  saveLocalData,
  getStorageName,
  getNameFromStorageName,
  getIDFromStorageName,
  getRandomFingerprint,
};
