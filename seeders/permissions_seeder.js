
const fs = require('fs');
const { getPermissionsFromJSON } = require('../config/permissions');
const { differenceBetweenTwoArrays } = require('../scripts/helpers');


function permissionsSeeder(app) {
  let CurrentRoutes = app._router.stack.filter(router => router.name == 'router');
  let permissionsList = [];
  //* get all current routes
  CurrentRoutes.forEach(el => {
    let routestack = el.handle.stack;
    let routename = el.regexp.toString().split('/')[2].slice(0, -1);
    
    routestack.forEach(stack => {
      permissionsList.push({
        path: routename+stack.route.path,
        method: Object.keys(stack.route.methods)[0],
        permission: getPermissionString(routename, stack.route.path, Object.keys(stack.route.methods)[0])
      }) 
    })
  })
  //* get old permissions list
  let listToJson = getPermissionsFromJSON();
  //* compare old perms with new perms
  let diffInPermissions = differenceBetweenTwoArrays(permissionsList.map(perm => perm.permission), listToJson.permissions);
  if(diffInPermissions.length != 0) {
    //* if there is a difference create new file with permissions
    var jsonList = JSON.stringify(permissionsList);
    fs.writeFile('permissions.json', jsonList, 'utf8', () => {});
  }
    
}
  
  function getPermissionString(pathModel, pathFunction, pathMethod) {
    let neededAuthorization = null;
    if(pathMethod == `post`) {
      switch (pathFunction) {
        case `/`:
          neededAuthorization = `${pathModel}.list`;
          break;
        case `/permissions`:
          neededAuthorization = `permissions.list`;
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
    } else if(pathMethod == `put`) {
      neededAuthorization = `${pathModel}.update`
    } else if(pathMethod == `patch`) {
      neededAuthorization = `${pathModel}.change`
    } else if(pathMethod == `delete`) {
      neededAuthorization = `${pathModel}.delete`
    }
    return neededAuthorization;
  }

module.exports = permissionsSeeder