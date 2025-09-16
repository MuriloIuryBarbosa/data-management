import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigration() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'data_management',
    });

    console.log('Connected to database. Running migration...');

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migracao_oc_multi_itens.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL commands and execute them
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (const command of commands) {
      if (command.trim() && !command.startsWith('--')) {
        console.log('Executing:', command.trim().substring(0, 50) + '...');
        await connection.execute(command);
      }
    }

    console.log('Migration completed successfully!');
    await connection.end();

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();