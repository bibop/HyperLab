const bcrypt = require('bcryptjs');

async function testBcrypt() {
  const password = 'testPassword123';
  const hash = await bcrypt.hash(password, 12);
  console.log('Hash:', hash);

  const match = await bcrypt.compare(password, hash);
  console.log('Do they match:', match);
}

testBcrypt();
