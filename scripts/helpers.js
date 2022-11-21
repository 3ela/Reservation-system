const bcrypt = require('bcrypt');
const moment = require('moment');

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
  formateDate(date, formateFrom, formateTo) {
    if(date) {
      let formatedDate = moment(date, formateFrom || ``).format(formateTo || `MM-DD-YYYY`);
      return formatedDate == "invalid date" ? undefined : formatedDate;
    } else {
      return undefined;
    }
  },
  isDatePassed(date) {
    let difference = date.diff(moment());
    return difference < 0;
  },
  differenceBetweenTwoArrays(firstArray, secondArray) {
    let firstIntoSet = new Set(firstArray);
    let result = [];
    secondArray.forEach(el => {
      if(!firstIntoSet.has(el)) {
        result.push(el)
      } 
    })
    return result;
  }
};

module.exports = helpersObj