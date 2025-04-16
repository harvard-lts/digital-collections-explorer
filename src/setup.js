#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const helpArg = args.includes('--help') || args.includes('-h');
const typeArg = args.find(arg => arg.startsWith('--type='));

// Available collection types
const COLLECTION_TYPES = ['photographs', 'maps', 'web-archives'];

// Show help if requested or if no type is provided
if (helpArg || !typeArg) {
  console.log(chalk.blue('Digital Collections Explorer - Setup'));
  console.log(chalk.gray('Configure your collection explorer instance\n'));
  console.log('Usage: npm run setup -- --type=<collection-type> [options]');
  console.log('\nOptions:');
  console.log('  --type=<collection-type>  Specify the collection type (required)');
  console.log('                           Available types: photographs, maps, web-archives');
  console.log('  --help, -h               Show this help message');
  process.exit(helpArg ? 0 : 1);
}

// Extract collection type from argument
const collectionType = typeArg.split('=')[1];

// Validate collection type
if (!COLLECTION_TYPES.includes(collectionType)) {
  console.error(chalk.red(`Error: Invalid collection type '${collectionType}'`));
  console.log(chalk.gray(`Available types: ${COLLECTION_TYPES.join(', ')}`));
  process.exit(1);
}

console.log(chalk.blue('Digital Collections Explorer - Setup'));
console.log(chalk.gray(`Configuring for collection type: ${chalk.cyan(collectionType)}\n`));

// Update configuration with selected options
updateConfig(collectionType);

// Install frontend dependencies and build
installAndBuildFrontend(collectionType);

console.log(chalk.green('\n✓ Setup completed successfully!'));
console.log(chalk.yellow('\n Go check README.md for the next step.'));

// Function to update the configuration file with user selections
function updateConfig(collectionType) {
  console.log(chalk.gray('Updating configuration...'));
  
  try {
    // Update config.json with frontend configuration
    const configPath = path.resolve(process.cwd(), 'config.json');
    const backendConfigPath = path.resolve(process.cwd(), 'src', 'backend', 'core', 'config.py');
    
    if (!fs.existsSync(configPath)) {
      console.error(chalk.red(`Error: Configuration file not found: ${configPath}`));
      console.log(chalk.yellow('Make sure you have a config.json file in the project root.'));
      process.exit(1);
    }
    
    // Update config.json
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Update frontend configuration
    config.frontend_config = {
      ...config.frontend_config,
      collection_type: collectionType,
      frontend_dir: `src/frontend/${collectionType}/dist`
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green('✓ config.json updated'));
    
    // Update backend config.py
    if (fs.existsSync(backendConfigPath)) {
      let configPy = fs.readFileSync(backendConfigPath, 'utf8');
      
      // Update the default frontend settings
      configPy = configPy.replace(
        /frontend_dir: str = ".*?"/,
        `frontend_dir: str = "src/frontend/${collectionType}/dist"`
      );
      configPy = configPy.replace(
        /collection_type: str = ".*?"/,
        `collection_type: str = "${collectionType}"`
      );
      
      fs.writeFileSync(backendConfigPath, configPy);
      console.log(chalk.green('✓ Backend config.py updated'));
    } else {
      console.warn(chalk.yellow('Warning: Backend config.py not found, skipping backend configuration update'));
    }
    
  } catch (error) {
    console.error(chalk.red(`Error updating configuration: ${error.message}`));
    process.exit(1);
  }
}

// Function to install dependencies and build the frontend
function installAndBuildFrontend(collectionType) {
  const frontendDir = path.resolve(process.cwd(), 'src', 'frontend', collectionType);
  
  // Check if the frontend directory exists
  if (!fs.existsSync(frontendDir)) {
    console.error(chalk.red(`Error: Frontend directory not found: ${frontendDir}`));
    console.log(chalk.yellow(`Make sure you have created the ${collectionType} frontend implementation.`));
    process.exit(1);
  }
  
  // Install dependencies
  console.log(chalk.gray(`Installing frontend dependencies for ${collectionType}...`));
  try {
    process.chdir(frontendDir);
    execSync('npm install', { stdio: 'inherit' });
    console.log(chalk.green('✓ Frontend dependencies installed'));
  } catch (error) {
    console.error(chalk.red(`Error installing frontend dependencies: ${error.message}`));
    process.exit(1);
  }
  
  // Build the frontend
  console.log(chalk.gray(`Building frontend for ${collectionType}...`));
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log(chalk.green('✓ Frontend built successfully'));
  } catch (error) {
    console.error(chalk.red(`Error building frontend: ${error.message}`));
    process.exit(1);
  }
  
  // Return to the project root
  process.chdir(process.cwd());
}
