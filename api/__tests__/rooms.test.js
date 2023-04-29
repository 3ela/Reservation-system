const supertest = require("supertest");
const { createInitialData } = require('./helpers.test');

const item = 'room';
const items = 'rooms';
const baseUrl = 'http://localhost:8001';

const newHotel = {
  name: 'test '+ item,
  address: "alex downtown",
  city: "alex"
}
var updateItem = {
  number: 352,
  type: "medium 2 room",
  guest_capacity: "4",
  price_per_night: "320",
  reserve_module: "trips",
}
var newItem = {
  number: 351,
  type: "medium 1 room",
  guest_capacity: "4",
  price_per_night: "220",
  reserve_module: "rooms",
}
var newItem2 = {
  number: 251,
  type: "medium 1 room",
  guest_capacity: "4",
  price_per_night: "220",
  reserve_module: "rooms",
}

var token, createdHotel;
var createdItems = [];

describe(`testing the ${items} route`, () => {
  beforeAll(async () => {
    //* create hotel for created rooms
    await createInitialData('hotels', newHotel)
      .then(res => {
        token = res.token;
        createdHotel = res.createdItem;
        createdHotelID = createdHotel.body.data._id;

        newItem.hotel_id = createdHotelID;
        newItem2.hotel_id = createdHotelID;
        updateItem.hotel_id = createdHotelID;
      })

    //* create first room 
    await createInitialData(items, newItem, token)
      .then(res => {
        createdItems[0] = res.createdItem;
      })

    //* create second room for testing delete many
    await createInitialData(items, newItem2, token)
      .then(res => {
        createdItems[1] = res.createdItem;
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
    it(`should update current ${item}`, async () => {
      const res = await supertest(baseUrl)
        .put(`/${items}/${createdItems[0].body.data._id}/update`)
        .set({ Authorization:'Bearer ' + token })
        .send(updateItem)
      
      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toBeDefined();
    })
  })
  
  describe(` testing get One ${item}`, () => {
    it(`should get that one row by id`, async () => {
      const res = await supertest(baseUrl)
        .post(`/${items}/${createdItems[0].body.data._id}`)
        .set({ Authorization:'Bearer ' + token })

      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toEqual(createdItems[0].body.data._id)
    })
  })

  describe(` testing delete Many ${items}`, () => {
    it(`should delete all items sent to the api`, async () => {
      const res = await supertest(baseUrl)
        .delete(`/${items}/many`)
        .send({rooms_ids: [createdItems[0].body.data._id, createdItems[1].body.data._id]})
        .set({ Authorization:'Bearer ' + token })

        const hotelRes = await supertest(baseUrl)
          .delete(`/hotels/${createdHotelID}/delete`)
          .set({ Authorization:'Bearer ' + token })

      expect(res.statusCode).toBe(200);
      expect(res.body.data.deletedCount).toBe(2)
      expect(hotelRes.statusCode).toBe(200);
      expect(hotelRes.body.data._id).toEqual(createdHotelID)
    })
  })
})