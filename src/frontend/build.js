#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Determine which collection type to build
let collectionType = 'photographs'; // Default

try {
  const activeTypePath = path.resolve(__dirname, 'active-type.json');
  if (fs.existsSync(activeTypePath)) {
    const activeType = JSON.parse(fs.readFileSync(activeTypePath, 'utf8'));
    collectionType = activeType.type || 'photographs';
  }
} catch (error) {
  console.error('Error reading active collection type:', error);
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