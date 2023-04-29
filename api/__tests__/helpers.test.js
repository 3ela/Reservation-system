const supertest = require("supertest");

const baseUrl = 'http://localhost:8001';
const user = {
  email: 'admin@email.com',
  password: '1234567m!',
}

var token, createdItem;


async function createInitialData(items, newItem, currtoken) {
  if(!currtoken) {
    let userRes = await supertest(baseUrl).post(`/users/login`).send(user);
    token = userRes.body.token;
  } else {
    token = currtoken;
  }

  createdItem = await supertest(baseUrl)
    .post(`/${items}/create`)
    .send(newItem)
    .set({ Authorization: 'Bearer ' + token });
  
  return {
    token,
    createdItem
  }
}

module.exports = {
  createInitialData
}