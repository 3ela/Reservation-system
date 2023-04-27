const RoleModel = require('../models/role_model');
const { mongooseInit } = require('../config/db');

let adminRole = {
  name: 'Admin',
  permissions: [
    'admin'
  ]
}

function rolesSeeder() {
  return new Promise((resolve, reject) => {
    mongooseInit().then(db => {
      RoleModel.find({})
        .then(res => {
          seedRoles().then(seededRole => {
            resolve(seededRole);
          })
        })
    })
  })
}

function seedRoles() {
  return new Promise((resolve, reject) => {
    RoleModel.create({...adminRole})
      .then(res => {
        resolve(res.id);
      })
  })
}


module.exports = {
  rolesSeeder,
}