const { mongooseInit } = require('./db');
const UserModel = require('../models/user_model');

const permissionObj = {
  appModules: [
    
  ],

  //! make a helper function that can get the permissions form req.userPerms
  //! and check for other models functions
  authUser: (req, res, next) => {
    //* connect to the DB
    let neededAuthorization = null;

    
    let pathModel = req.baseUrl.slice(1);
    let pathFunction = req.url;
    let pathMethod = req.method;
    
    if(pathMethod == `POST`) {
      switch (pathFunction) {
        case `/`:
          neededAuthorization = `${pathModel}.list`;
          break;
        case `/signup`:
          neededAuthorization = `${pathModel}.create`;
          break;
        case `/create`:
          neededAuthorization = `${pathModel}.create`;
          break;
        default: 
          neededAuthorization = `${pathModel}.list`;
      }
    } else if(pathMethod == `PUT`) {
      neededAuthorization = `${pathModel}.update`
    } else if(pathMethod == `PATCH`) {
      neededAuthorization = `${pathModel}.change`
    } else if(pathMethod == `DELETE`) {
      neededAuthorization = `${pathModel}.delete`
    }
    
    //* connect to the DB
    mongooseInit().then(DBRes => {
      //* grab user perms from current role
      UserModel.findById(req.validatedUser.id)
      .populate('role_id')
      .then(user => {
        if(user == null) {
          res.status(401).json({
            msg: `User Doesnt exist`,
            user: user.role_id
          });
        } else {
          if(user.role_id == null) {
            res.status(401).json({
              msg: `User is not Authorized`,
              user: user
            });
          }
          //* if current role allow this action Or this route access => done
          let isAuthorized = 
            user.role_id.permissions.includes('admin')
            || user.role_id.permissions.includes(neededAuthorization);
          if(isAuthorized) {
            req.authorizedUser = user;
            next();
          }else {
            res.status(401).json({
              // msg: `User is not Authorized`,
              // needed_permission: neededAuthorization,
              // user: user.role_id
            });
          }
        }
      }).catch(err => next(err))
    }).catch(DBerr => next(DBerr))
  },
  checkPermissionExistance: (req, permission, next) => {
    let userPerms = req.authorizedUser.role_id.permissions;
    let isAuthorized = userPerms.includes(permission) || userPerms.includes('admin');
    if (isAuthorized == false) {
      next({
        msg: `User is not Authorized`,
        needed_permission: permission,
      })
    }
  },
  checkForBlacklistedUser: (userId) => {
    // todo blacklisted users 
    //* connect to the DB
    //* if current User ID in the blacklist => logout user
    //* else done
  },
  createListPermissionsReturnData() {
    // todo all current permissions
    //* make the 
  }
}

module.exports = permissionObj;