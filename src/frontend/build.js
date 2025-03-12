#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Determine which collection type to build
let collectionType = 'photographs'; // Default

try {
  // Read from config.json instead of active-type.json
  const configPath = path.resolve(process.cwd(), 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    // Get collection_type from frontend_config
    if (config.frontend_config && config.frontend_config.collection_type) {
      collectionType = config.frontend_config.collection_type;
    } else {
      console.log('No collection_type found in config.json frontend_config');
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
  
  // Run npm build
  console.log('Running npm build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log(`Frontend for ${collectionType} built successfully!`);
} catch (error) {
  console.error('Error building frontend:', error);
  process.exit(1);
} 