const UserModel = require('../models/user_model');
const { rolesSeeder } = require('./roles_seeder');
const { mongooseInit } = require('../config/db')
const { hashPassword } = require('../scripts/helpers');

let user = {
  email: `admin@email.com`,
  name: 'admin',
  password: hashPassword('1234567m!')
}

function usersSeeder() {
  mongooseInit().then(db => {
    UserModel.find({})
      .then(res => {
        if(res.length == 0) {
          seedUser(user);
        }
      }).catch(err => console.error(err))
  })
}

function seedUser(user) {
  rolesSeeder().then(adminRoleID => {
    UserModel.create({
      ...user,
      role_id: adminRoleID,
    })
  })
}

module.exports = usersSeeder;



