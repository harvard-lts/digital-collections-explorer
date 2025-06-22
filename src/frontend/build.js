#!/usr/bin/env node

/** build.js -- "Rebuilds the Frontend for Production Deployment."
 * This script is intended for use after customizing the frontend and making code changes. 
 * Note that the frontend is initially built during the setup process (setup.js).
 * 
 * Usage:
 * 1. Customize the frontend code
 * 2. Run `npm run frontend-build` to invoke this script
 * 3. Then, you can deploy the frontend bundle to your server
 **/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Determine which collection type to build
let collectionType = 'photographs'; // Default collection type, will be overwritten by config.json later

try {
  const configPath = path.resolve(process.cwd(), 'config.json');

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (config.collection_type) {
      collectionType = config.collection_type;
    } else {
      console.log('No collection_type found in config.json');
      console.log('Defaulting to photographs');
    }
  } else {
    console.log('config.json not found');
    console.log('Defaulting to photographs');
  }
} catch (error) {
  console.error('Error reading configuration:', error);
  console.log('Defaulting to photographs');
}

console.log(`Building frontend for collection type: ${collectionType}`);

// Change to the appropriate directory and run the build
try {
  const collectionDir = path.resolve(__dirname, collectionType);
  process.chdir(collectionDir);
  console.log(`Changed directory to: ${collectionDir}`);
  
  console.log('Running npm build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log(`Frontend for ${collectionType} built successfully!`);
} catch (error) {
  console.error('Error building frontend:', error);
  process.exit(1);
} 