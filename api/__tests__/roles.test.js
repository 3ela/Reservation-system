const supertest = require("supertest");

const item = 'role';
const items = 'roles';
const baseUrl = 'http://localhost:8001';

const updateItem = {
  name: 'test updated'+ item,
  permissions: [
    "roles.list",
    "roles.create",
		"roles.update",
  ],
}
const newItem = {
  name: 'test '+ item,
  permissions: [
    "roles.list",
		"permissions.list",
  ],
}
const user = {
  email: "admin@email.com",
  password: "1234567m!"
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
    console.log("beforeAll => createdItem:", createdItem.body)
  })


  describe(`testing the listing of the ${items}`, () => {
    it(`should return a list of ${items}`, async () => {
      const res = await supertest(baseUrl).post(`/${items}`).set({ Authorization:'Bearer ' + token });
      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toBeDefined();
    })
  });

  describe(` testing update of ${item}`, () => {
    it(`should update current ${item} and its permissions `, async () => {
      const res = await supertest(baseUrl)
        .put(`/${items}/${createdItem.body.data.id}/update`)
        .set({ Authorization:'Bearer ' + token })
        .send(updateItem)
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.permissions).toBeDefined();
    })
  })
  
  describe(` testing get One ${item}`, () => {
    it(`should get that one row by id`, async () => {
      const res = await supertest(baseUrl)
        .post(`/${items}/${createdItem.body.data.id}`)
        .set({ Authorization:'Bearer ' + token })

      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toEqual(createdItem.body.data.id)
    })
  })

  describe(` testing delete One ${item}`, () => {
    it(`should delete that one row by id`, async () => {
      const res = await supertest(baseUrl)
        .delete(`/${items}/${createdItem.body.data.id}/delete`)
        .set({ Authorization:'Bearer ' + token })

      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toEqual(createdItem.body.data.id)
    })
  })
})