/**
 * One-off migration: give every existing property a GeoJSON `location` derived
 * from its latitude/longitude, plus derived area fields, so it shows up on the
 * GIS map. Safe to re-run — it only touches documents that still need it.
 *
 *   node scripts/backfillGeo.js          # apply
 *   node scripts/backfillGeo.js --dry    # report only
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from '../models/Property.js';
import { SQM_PER_ACRE } from '../lib/geo.js';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to ${mongoose.connection.name}${DRY_RUN ? ' (dry run)' : ''}`);

  const docs = await Property.find({}).lean();
  console.log(`Scanning ${docs.length} properties…`);

  let located = 0;
  let sized = 0;
  let skipped = 0;

  for (const doc of docs) {
    const update = {};

    const hasLocation = Array.isArray(doc.location?.coordinates) && doc.location.coordinates.length === 2;
    const lat = Number(doc.latitude);
    const lng = Number(doc.longitude);

    if (!hasLocation && Number.isFinite(lat) && Number.isFinite(lng) &&
        Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)) {
      update.location = { type: 'Point', coordinates: [lng, lat] };
      located++;
    }

    if (!Number.isFinite(doc.areaSqm) &&
        Number.isFinite(doc.lengthM) && Number.isFinite(doc.widthM)) {
      const sqm = Math.round(doc.lengthM * doc.widthM * 100) / 100;
      update.areaSqm = sqm;
      update.areaAcres = Math.round((sqm / SQM_PER_ACRE) * 10000) / 10000;
      sized++;
    }

    if (!doc.status) update.status = 'Available';

    if (!Object.keys(update).length) {
      skipped++;
      continue;
    }

    if (!DRY_RUN) {
      await Property.updateOne({ _id: doc._id }, { $set: update });
    }
  }

  console.log(`  location added : ${located}`);
  console.log(`  area derived   : ${sized}`);
  console.log(`  already fine   : ${skipped}`);

  if (!DRY_RUN) {
    console.log('Rebuilding indexes…');
    await Property.syncIndexes();
    console.log('Indexes in sync.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(async (err) => {
  console.error('Backfill failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
