const { createClient } = require('@vercel/kv');
const { list } = require('@vercel/blob');
require('dotenv').config({ path: '.env.local' });

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KBOB_VERSIONS_KEY = "kbob/versions";

const STORAGE_PREFIX = "kbob";

function getMaterialVersionKey(version) {
  return `${STORAGE_PREFIX}/materials_v${version}.json`;
}

async function getBlobContent(key) {
  try {
    const cleanKey = key.replace(/\/+/g, '/').replace(/^\//, '');
    const prefix = cleanKey.includes('/') ? cleanKey.substring(0, cleanKey.lastIndexOf('/') + 1) : '';
    
    const { blobs } = await list({
      prefix: prefix,
      limit: 1000,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    const blob = blobs.find(b => b.pathname === cleanKey);
    if (!blob) return null;
    
    const res = await fetch(blob.url);
    if (!res.ok) return null;
    
    return JSON.parse(await res.text());
  } catch (e) {
    console.error(`Error fetching ${key}:`, e.message);
    return null;
  }
}

function compareValues(oldVal, newVal, fieldName) {
  if (oldVal === newVal) return null;
  if (oldVal === null && newVal === null) return null;
  
  // Both are numbers - check if difference is significant
  if (typeof oldVal === 'number' && typeof newVal === 'number') {
    const diff = Math.abs(oldVal - newVal);
    const percentDiff = oldVal !== 0 ? (diff / Math.abs(oldVal)) * 100 : (newVal !== 0 ? 100 : 0);
    return {
      field: fieldName,
      old: oldVal,
      new: newVal,
      diff: diff,
      percentDiff: percentDiff.toFixed(2)
    };
  }
  
  // String or other types
  return {
    field: fieldName,
    old: oldVal,
    new: newVal
  };
}

function compareMaterials(oldMat, newMat) {
  const changes = [];
  
  // Compare all numeric fields
  const numericFields = [
    'ubp21Total', 'ubp21Production', 'ubp21Disposal',
    'gwpTotal', 'gwpProduction', 'gwpDisposal',
    'biogenicCarbon',
    'primaryEnergyTotal', 'primaryEnergyProductionTotal',
    'primaryEnergyProductionEnergetic', 'primaryEnergyProductionMaterial',
    'primaryEnergyDisposal',
    'primaryEnergyRenewableTotal', 'primaryEnergyRenewableProductionTotal',
    'primaryEnergyRenewableProductionEnergetic', 'primaryEnergyRenewableProductionMaterial',
    'primaryEnergyRenewableDisposal',
    'primaryEnergyNonRenewableTotal', 'primaryEnergyNonRenewableProductionTotal',
    'primaryEnergyNonRenewableProductionEnergetic', 'primaryEnergyNonRenewableProductionMaterial',
    'primaryEnergyNonRenewableDisposal',
    'densityMin', 'densityMax'
  ];
  
  numericFields.forEach(field => {
    const change = compareValues(oldMat[field], newMat[field], field);
    if (change) changes.push(change);
  });
  
  // Compare string fields
  const stringFields = ['density', 'unit', 'nameDE', 'nameFR'];
  stringFields.forEach(field => {
    if (oldMat[field] !== newMat[field]) {
      changes.push({
        field: field,
        old: oldMat[field],
        new: newMat[field]
      });
    }
  });
  
  return changes;
}

async function compareVersions(version1, version2) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Comparing Version ${version1} → ${version2}`);
  console.log('='.repeat(80));
  
  const materials1 = await getBlobContent(getMaterialVersionKey(version1));
  const materials2 = await getBlobContent(getMaterialVersionKey(version2));
  
  if (!materials1 || !materials2) {
    console.error(`Failed to load one or both versions`);
    return;
  }
  
  // Index by UUID
  const map1 = new Map(materials1.map(m => [m.uuid, m]));
  const map2 = new Map(materials2.map(m => [m.uuid, m]));
  
  const allUuids = new Set([...map1.keys(), ...map2.keys()]);
  
  const added = [];
  const removed = [];
  const changed = [];
  const unchanged = [];
  
  for (const uuid of allUuids) {
    const mat1 = map1.get(uuid);
    const mat2 = map2.get(uuid);
    
    if (!mat1 && mat2) {
      added.push({ uuid, material: mat2 });
    } else if (mat1 && !mat2) {
      removed.push({ uuid, material: mat1 });
    } else if (mat1 && mat2) {
      const changes = compareMaterials(mat1, mat2);
      if (changes.length > 0) {
        changed.push({ uuid, id: mat1.id, nameDE: mat1.nameDE, changes });
      } else {
        unchanged.push(uuid);
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total materials in ${version1}: ${materials1.length}`);
  console.log(`   Total materials in ${version2}: ${materials2.length}`);
  console.log(`   Added: ${added.length}`);
  console.log(`   Removed: ${removed.length}`);
  console.log(`   Changed: ${changed.length}`);
  console.log(`   Unchanged: ${unchanged.length}`);
  
  if (added.length > 0) {
    console.log(`\n➕ Added Materials (${added.length}):`);
    added.slice(0, 10).forEach(({ uuid, material }) => {
      console.log(`   - ${material.id}: ${material.nameDE}`);
    });
    if (added.length > 10) console.log(`   ... and ${added.length - 10} more`);
  }
  
  if (removed.length > 0) {
    console.log(`\n➖ Removed Materials (${removed.length}):`);
    removed.slice(0, 10).forEach(({ uuid, material }) => {
      console.log(`   - ${material.id}: ${material.nameDE}`);
    });
    if (removed.length > 10) console.log(`   ... and ${removed.length - 10} more`);
  }
  
  if (changed.length > 0) {
    console.log(`\n🔄 Changed Materials (${changed.length}):`);
    
    // Group by field to see which fields changed most
    const fieldStats = {};
    changed.forEach(({ changes }) => {
      changes.forEach(change => {
        if (!fieldStats[change.field]) {
          fieldStats[change.field] = { count: 0, totalPercentDiff: 0, samples: [] };
        }
        fieldStats[change.field].count++;
        if (change.percentDiff) {
          fieldStats[change.field].totalPercentDiff += parseFloat(change.percentDiff);
        }
        if (fieldStats[change.field].samples.length < 3) {
          fieldStats[change.field].samples.push(change);
        }
      });
    });
    
    console.log(`\n   Fields Changed:`);
    Object.entries(fieldStats)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([field, stats]) => {
        const avgPercent = stats.count > 0 ? (stats.totalPercentDiff / stats.count).toFixed(2) : '0';
        console.log(`   - ${field}: ${stats.count} materials changed (avg ${avgPercent}% change)`);
        if (stats.samples.length > 0) {
          stats.samples.forEach(sample => {
            if (sample.percentDiff) {
              console.log(`     Example: ${sample.old} → ${sample.new} (${sample.percentDiff}% diff)`);
            } else {
              console.log(`     Example: ${sample.old} → ${sample.new}`);
            }
          });
        }
      });
    
    // Show detailed changes for first 5 materials
    console.log(`\n   Detailed Changes (first 5 materials):`);
    changed.slice(0, 5).forEach(({ id, nameDE, changes }) => {
      console.log(`\n   ${id}: ${nameDE}`);
      changes.forEach(change => {
        if (change.percentDiff) {
          console.log(`     ${change.field}: ${change.old} → ${change.new} (${change.percentDiff}% diff)`);
        } else {
          console.log(`     ${change.field}: ${change.old} → ${change.new}`);
        }
      });
    });
    
    if (changed.length > 5) {
      console.log(`\n   ... and ${changed.length - 5} more materials with changes`);
    }
  }
  
  return {
    version1,
    version2,
    added: added.length,
    removed: removed.length,
    changed: changed.length,
    unchanged: unchanged.length,
    details: { added, removed, changed }
  };
}

async function compareAllVersions() {
  const versions = await kv.get(KBOB_VERSIONS_KEY);
  if (!versions || versions.length < 2) {
    console.log("Need at least 2 versions to compare");
    return;
  }
  
  // Sort versions by date
  const sortedVersions = [...versions].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return dateA - dateB; // Oldest first
  });
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Comparing All Versions (${sortedVersions.length} versions)`);
  console.log('='.repeat(80));
  
  for (let i = 0; i < sortedVersions.length - 1; i++) {
    const v1 = sortedVersions[i];
    const v2 = sortedVersions[i + 1];
    await compareVersions(v1.version, v2.version);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--all')) {
    try {
      await compareAllVersions();
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
    return;
  }
  
  const version1 = args.find((a, i) => args[i-1] === '--from');
  const version2 = args.find((a, i) => args[i-1] === '--to');
  
  if (!version1 || !version2) {
    console.log("Usage:");
    console.log("  Compare two versions:");
    console.log("    node scripts/compare-versions.js --from <version> --to <version>");
    console.log("  Compare all versions sequentially:");
    console.log("    node scripts/compare-versions.js --all");
    console.log("\nExample:");
    console.log("  node scripts/compare-versions.js --from 6.2 --to 7.0");
    process.exit(1);
  }
  
  try {
    await compareVersions(version1, version2);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
