const supertest = require("supertest");

const item = 'role';
const items = 'roles';
const baseUrl = 'http://localhost:8001';

const updateItem = {
  name: 'test updated'+ item,
  unit_count: 3,
}
const newItem = {
  name: 'test '+ item,
  unit_count: 2,
}
const role = {
  name: 'admin3@email.com',
  permissions: [
    
  ],
}
var token, createdItem;

describe(`testing the ${items} route`, () => {
  beforeAll(async () => {
    let userRes = await supertest(baseUrl).post(`/users/login`).send(user);
    
    token = userRes.body.token;
    createdItem = await supertest(baseUrl)
      .post(`/${items}/create`)
      .send(newItem)
      .set({ Authorization: 'Bearer ' + token });
  })


  describe(`testing the listing of the ${items}`, () => {
    it(`should return a list of ${items}`, async () => {
      const res = await supertest(baseUrl).post(`/${items}`).set({ Authorization:'Bearer ' + token });
      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toMatch('Amenities Found');
    })
  });

  describe(` testing update of ${item}`, () => {
    it(`should update current ${item} && change icon if sent to the api`, async () => {
      const res = await supertest(baseUrl)
        .put(`/${items}/${createdItem.body.data._id}/update`)
        .set({ Authorization:'Bearer ' + token })
        .attach('icon', './api/__tests__/amenities.png')
        .field('name', 'test update')
        .field('unit_count', 3)
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.icon_path).toBeDefined();
    })
  })
  
  describe(` testing get One ${item}`, () => {
    it(`should get that one row by id`, async () => {
      const res = await supertest(baseUrl)
        .post(`/${items}/${createdItem.body.data._id}`)
        .set({ Authorization:'Bearer ' + token })

      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toEqual(createdItem.body.data._id)
    })
  })

  describe(` testing delete One ${item}`, () => {
    it(`should delete that one row by id`, async () => {
      const res = await supertest(baseUrl)
        .delete(`/${items}/${createdItem.body.data._id}/delete`)
        .set({ Authorization:'Bearer ' + token })

      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toEqual(createdItem.body.data._id)
    })
  })
})