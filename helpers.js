const getUserByEmail = (email, database) => {
  for (const userId in database) {
    const user = database[userId];
    if (user.email === email) {
      return user;
    }
  }
}

function generateRandomString() {
  const str = 'abcdefghigklmnopqrstuvhxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomStr = '';
  while (randomStr.length < 6) {
    let ranNum = Math.floor(Math.random() * str.length)
    randomStr += str[ranNum];
  }
  return randomStr;
}

module.exports = { getUserByEmail, generateRandomString };