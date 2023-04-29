const supertest = require("supertest");
const { createInitialData } = require('./helpers.test');

const item = 'route';
const items = 'routes';
const baseUrl = 'http://localhost:8001';

const updateItem = {
  name: 'test updated'+ item,
  unit_count: 3,
}
const newItem = {
  name: 'test '+ item,
  unit_count: 2,
}
var token, createdItem;

describe(`testing the ${items} route`, () => {
  beforeAll(async () => {
    
    await createInitialData(items, newItem)
      .then(res => {
        token = res.token;
        createdItem = res.createdItem;
      })
  })



  describe(`testing the listing of the ${items}`, () => {
    it(`should return a list of ${items}`, async () => {
      const res = await supertest(baseUrl).post(`/${items}`).set({ Authorization:'Bearer ' + token });
      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toBeDefined();
    })
  });

  describe(` testing update of ${item}`, () => {
    it(`should update current ${item} `, async () => {
      const res = await supertest(baseUrl)
        .put(`/${items}/${createdItem.body.data._id}/update`)
        .set({ Authorization:'Bearer ' + token })
        //? usedonly for file upload testing
        // .attach('icon', './api/__tests__/amenities.png')
        // .field('name', 'test update')
        // .field('unit_count', 3)
        .send(updateItem)
      
      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toBeDefined();
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