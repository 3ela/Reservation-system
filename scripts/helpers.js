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
    if(!firstArray || (firstArray?.length && firstArray?.length == 0)) {
      //* nothing exists in the first array to compare with the second
      return [];
    } else if(!secondArray || (secondArray?.length && secondArray?.length == 0)) {
      //* nothing exists in the second array to compare with the first
      return firstArray;
    } else {
      let secondIntoSet = new Set(secondArray);
      let result = [];
      firstArray.forEach(el => {
        if(!secondIntoSet.has(el)) {
          result.push(el)
        } 
      })
      // console.log("differenceBetweenTwoArrays => result", result)
      return result;
    }
  }
};

module.exports = helpersObj