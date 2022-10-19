const bcrypt = require('bcrypt');

helpersObj = {
  currentDate: () => {
    return new Date().toString();
  },
  hashPassword: (password) => {
    let saltRounds = 13;
    return bcrypt.hashSync(password, saltRounds);
  },
  getDuplicateIds: (arr, key) => {
    let filtered = arr.filter(key => arr.indexOf(key) !== arr.lastIndexOf(key)) 
    if(filtered.length > 0) {
      return filtered;
    }else {
      return -1;
    }
  },
};

module.exports = helpersObj