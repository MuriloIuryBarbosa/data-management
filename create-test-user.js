const { createUser } = require('./dist/models/user');

(async () => {
  try {
    console.log('Creating test user...');
    const user = await createUser('admin@test.com', 'admin123', 'Administrador', 'admin');
    console.log('User created successfully:', user);
  } catch (e) {
    console.log('Error creating user:', e.message);
  }
  process.exit();
})();