const supertest = require("supertest");
const { createInitialData } = require('./helpers.test');

const item = 'hotel';
const items = 'hotels';
const baseUrl = 'http://localhost:8001';

const updateItem = {
  name: 'test updated'+ item,
  address: "cairo downtown",
  city: "cairo"
}
const newItem = {
  name: 'test '+ item,
  address: "alex downtown",
  city: "alex"
}
var rooms = [
  {
       number: 340,
       type: "suit",
       guest_capacity: 3,
       price_per_night: 2000
   },
   {
       number: 341,
       type: "medium room",
       guest_capacity: 4,
       price_per_night: 1000
   },
   {
       number: 342,
       type: "large room",
       guest_capacity: 8,
       price_per_night: 1500
   }      
]

var token, createdItem, createdItemWithRooms;

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

  describe(` testing create of ${item} with Rooms`, () => {
    it(`should create a new ${item} && add rooms to it`, async () => {
      const res = await supertest(baseUrl)
        .post(`/${items}/create`)
        .set({ Authorization:'Bearer ' + token })
        .send({...newItem, rooms})
      
      createdItemWithRooms = res;

      expect(res.statusCode).toBe(200);
      expect(res.body.data.rooms_ids).toBeDefined();
    })
  })

  describe(` testing update of ${item}`, () => {
    it(`should update current ${item} && change icon if sent to the api`, async () => {
      const res = await supertest(baseUrl)
        .put(`/${items}/${createdItem.body.data._id}/update`)
        .set({ Authorization:'Bearer ' + token })
        .send(updateItem)
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toMatch('test updated'+ item);
    })
  })

  // describe(` testing update of ${item} with rooms`, () => {
  //   it(`should update current ${item} && change icon if sent to the api`, async () => {
  //     const res = await supertest(baseUrl)
  //       .put(`/${items}/${createdItem.body.data._id}/update`)
  //       .set({ Authorization:'Bearer ' + token })
  //       .send(updateItem)
      
  //     expect(res.statusCode).toBe(200);
  //     expect(res.body.data.icon_path).toBeDefined();
  //   })
  // })
  
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
  describe(` testing delete One ${item} with rooms`, () => {
    it(`should delete that one row by id which contains rooms`, async () => {
      const res = await supertest(baseUrl)
        .delete(`/${items}/${createdItemWithRooms.body.data._id}/delete`)
        .set({ Authorization:'Bearer ' + token })

      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toEqual(createdItemWithRooms.body.data._id)
    })
  })
})