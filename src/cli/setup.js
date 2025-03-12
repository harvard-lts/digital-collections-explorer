#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const helpArg = args.includes('--help') || args.includes('-h');
const typeArg = args.find(arg => arg.startsWith('--type='));
const nameArg = args.find(arg => arg.startsWith('--name='));

// Available collection types
const COLLECTION_TYPES = ['photographs', 'maps', 'web-archives'];

// Show help if requested or if no type is provided
if (helpArg || !typeArg) {
  console.log(chalk.blue('Digital Collections Explorer - Setup'));
  console.log(chalk.gray('Configure your collection explorer instance\n'));
  console.log('Usage: npm run setup -- --type=<collection-type> [--name="Project Name"] [options]');
  console.log('\nOptions:');
  console.log('  --type=<collection-type>  Specify the collection type (required)');
  console.log('                           Available types: photographs, maps, web-archives');
  console.log('  --name="Project Name"    Specify the project name (optional)');
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

// Extract project name from argument or use default
const projectName = nameArg 
  ? nameArg.split('=')[1].replace(/^"|"$/g, '') // Remove quotes if present
  : 'Digital Collections Explorer';

console.log(chalk.blue('Digital Collections Explorer - Setup'));
console.log(chalk.gray(`Configuring for collection type: ${chalk.cyan(collectionType)}`));
console.log(chalk.gray(`Project name: ${chalk.cyan(projectName)}\n`));

// Update configuration with selected options
updateConfig(collectionType, projectName);

// Install frontend dependencies and build
installAndBuildFrontend(collectionType);

// Display next steps
displayNextSteps(collectionType);

// Function to update the configuration file with user selections
function updateConfig(collectionType, projectName) {
  console.log(chalk.gray('Updating configuration...'));
  
  try {
    // Update config.json with frontend configuration
    const configPath = path.resolve(process.cwd(), 'config.json');
    
    if (!fs.existsSync(configPath)) {
      console.error(chalk.red(`Error: Configuration file not found: ${configPath}`));
      console.log(chalk.yellow('Make sure you have a config.json file in the project root.'));
      process.exit(1);
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Update frontend configuration
    config.frontend_config = {
      ...config.frontend_config,
      collection_type: collectionType,
      project_name: projectName
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log(chalk.green('✓ Configuration updated'));
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

// Function to display next steps
function displayNextSteps(collectionType) {
  console.log(chalk.green('\n✓ Setup completed successfully!'));
  console.log(chalk.yellow('\nNext steps:'));
  
  console.log('1. Add your images to ' + chalk.cyan('data/raw/'));
  console.log('2. Run ' + chalk.cyan('python -m src.models.generate_embeddings'));
  console.log('3. Start the server with ' + chalk.cyan('python -m src.backend.main'));
} 
