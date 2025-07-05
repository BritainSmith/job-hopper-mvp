#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { printConfig, validateEnvironment } from '../src/config/env';

console.log('🔧 Job Hopper Environment Setup');
console.log('================================\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('❌ No .env file found!');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Creating .env file from .env.example...');
    try {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .env file created successfully!');
      console.log('📝 Please edit the .env file with your actual values.');
    } catch (error) {
      console.error('❌ Failed to create .env file:', error);
      process.exit(1);
    }
  } else {
    console.log('❌ No .env.example file found either!');
    console.log('📝 Please create a .env file manually with your configuration.');
    process.exit(1);
  }
} else {
  console.log('✅ .env file found!');
}

console.log('\n📋 Current Environment Configuration:');
console.log('=====================================');

try {
  // Load and print current configuration
  printConfig();
  
  // Validate environment
  console.log('\n🔍 Validating environment...');
  validateEnvironment();
  
  console.log('\n🎉 Environment setup complete!');
  console.log('\n💡 Tips:');
  console.log('- Edit .env file to customize your configuration');
  console.log('- Never commit .env file to version control');
  console.log('- Use .env.example as a template for required variables');
  
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
} 