import {
  findFrameData,
  findTalentData,
} from './data.js';

function newSource(name, id, diceString, damageType = '', traitData = null) {
  return {
    name: name,
    id: id,
    diceString: diceString,
    type: damageType,
    trait: traitData,
  }
}

function findTraitFromFrame(frameData, traitName) {
  const traitData = frameData.traits.find(trait => trait.name === traitName);
  return traitData || null;
}

function newSourceFromFrame(frameData, diceString, damageType = '', traitName = '') {
  return newSource(
    traitName || frameData.name,
    frameData.id,
    diceString,
    damageType,
    findTraitFromFrame(frameData, traitName)
  )
}

function getBonusDamageSourcesFromMech(mechData) {
  var sources = [];

  const frameData = findFrameData(mechData.frame);
  if (!frameData) return sources;

  switch (frameData.id) {
    case 'mf_nelson':
      sources.push( newSourceFromFrame(frameData, '1d6', '', 'Momentum') );
      break;

    case 'mf_deaths_head':
      sources.push( newSource('Mark for Death - Aux', 'mf_deaths_head_aux', '1d6', '') );
      sources.push( newSource('Mark for Death - Main', 'mf_deaths_head_main', '2d6', '') );
      sources.push( newSource('Mark for Death - Heavy', 'mf_deaths_head_heavy', '3d6', '') );
      break;

    case 'mf_mourning_cloak':
      sources.push( newSourceFromFrame(frameData, '1d6', '', 'Hunter') );
      break;

    case 'mf_tokugawa':
      sources.push( newSourceFromFrame(frameData, '3', 'Energy', 'Limit Break') );
      sources.push( newSource('Plasma Sheath', 'mf_tokugawa_dz', '—', 'Burn', findTraitFromFrame(frameData, 'Plasma Sheath')) );
      break;
  }

  return sources;
}

function addSourceFromTalent(sources, currentRank, talentData, rank, diceString, damageType = '', customID = '') {
  if (currentRank >= rank) {
    const rankData = talentData.ranks[rank-1];

    sources.push(newSource(
      rankData.name || talentData.name,
      customID || `${talentData.id}_${rank}`,
      diceString,
      damageType,
      rankData
    ));
  }
}

function getBonusDamageSourcesFromTalents(pilotData) {
  var sources = [];

  pilotData.talents.forEach(talentAndRank => {
    const talentData = findTalentData(talentAndRank.id);
    const rank = talentAndRank.rank;

    if (talentData) {
      switch (talentData.id) {
        case 't_crack_shot':
          addSourceFromTalent(sources,rank, talentData, 2, '1d6', '');
          break;
        case 't_gunslinger':
          addSourceFromTalent(sources,rank, talentData, 3, '2d6', '');
          break;
        case 't_nuclear_cavalier':
          addSourceFromTalent(sources,rank, talentData, 1, '2', 'Heat', 't_nuclear_cavalier');
          addSourceFromTalent(sources,rank, talentData, 2, '1d6', 'Energy', 't_nuclear_cavalier');
          break;
        case 't_walking_armory':
          if (rank >= 1) {
            // sources.push( newSourceFromTalent(talentData, 2, '', '', 'THUMPER') );
            // sources.push( newSourceFromTalent(talentData, 2, '', '', 'SHOCK') );
            // sources.push( newSourceFromTalent(talentData, 2, '', '', 'MAG') );
          }
          if (rank >= 2) {
            sources.push( newSource('HELLFIRE', 't_walking_armory_2_hellfire', '—', 'Burn', talentData.ranks[1]) );
            // sources.push( newSource('JAGER', 't_walking_armory_2_jager', '', '', talentData.ranks[1]) );
            // sources.push( newSource('SABOT', 't_walking_armory_2_sabot', '', '', talentData.ranks[1]) );
          }
          break;
      }
    }
  });



  return sources;
}


export { getBonusDamageSourcesFromMech, getBonusDamageSourcesFromTalents };