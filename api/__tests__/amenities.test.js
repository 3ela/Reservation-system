const supertest = require("supertest");

const item = 'amenity';
const items = 'amenities';

const newItem = {
  name: 'test '+ item,
  unit_count: 2,
}
const user = {
  email: 'admin3@email.com',
  password: '1234567m!',
}
var token ;

describe(`testing the ${items} route`, () => {
  beforeAll(async () => {
    let userRes = await supertest('http://localhost:8001').post(`/users/login`).send(user);
    token = userRes.body.token;
    await supertest('http://localhost:8001')
    .post(`/${items}/create`).send(newItem).set({ Authorization: 'Bearer ' + token });
  })


  describe(`testing the listing of the ${items}`, () => {
    it(`should return a list of ${items}`, async () => {
      const res = await supertest('http://localhost:8001').post(`/${items}`).set({ Authorization:'Bearer ' + token });
      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toMatch('Amenities Found');
    })
  })
})