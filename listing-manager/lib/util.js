/*
  This file contains a collection of low-level 'utility' functions used by the
  Listing Manager. By modularizing the code into a series of subfunctions in
  this file, it makes each subfunciton easier to test. It also makes the code
  in Listing Manager easier to read, since you only have to follow the
  high-level calls.

  Functions in this library:

  -Client/Device related functions:
  getDevicePublicModel - get the devicePublicModel associated with a Client.
  getDevicePrivateModel - get the devicePrivateModel associated with a Client.
  updateExpiration - Update the expiration date of a Client.
  addRentedDevice - Add a Client to the Rented Device list.
  removeRentedDevice - remove a Client from the Rented Device list.
  getRentedDevices - Get a list of devices stored in the Rented Device list.

  -OpenBazaar (OB) related functions:
  getNewOBNotifications - Get new notifications from OpenBazaar.
  markNotificationAsRead - Mark an OB notification as read.
  fulfillOBOrder - Mark an OB order as fulfilled.
  removeOBListing - Remove a listing on OB.
  getObContractModel - Get an obContract model for the device.

*/

"use strict";

// Dependencies
const rp = require("request-promise");
const openbazaar = require("openbazaar-node");
const fs = require("fs");

// This function returns a devicePublicModel given the deviceId.
async function getDevicePublicModel(config, deviceId) {
  try {
    const options = {
      method: "GET",
      uri: `${config.server}:${config.port}/api/devices/${deviceId}`,
      json: true, // Automatically stringifies the body to JSON
    };

    const data = await rp(options);

    if (data.device === undefined) throw `No devicePublicModel with ID of ${deviceId}`;

    return data.device;
  } catch (err) {
    config.logr.error(`Error in util.js/getDevicePublicModel(): ${err}`);

    if (err.statusCode >= 500) {
      if (err.error === "database error") {
        config.logr.error(`Database error. GUID ${deviceId} could not be found.`);
        throw "database error";
      } else {
        config.logr.error(
          "util.js/getDevicePublicModel(): Connection to the server was refused. Will try again."
        );
      }
    } else {
      config.logr.error(`Error stringified: ${JSON.stringify(err, null, 2)}`);
    }
    throw err;
  }
}

// This function returns a devicePrivateModel given ID for the model.
async function getDevicePrivateModel(config, privateId) {
  try {
    const options = {
      method: "GET",
      uri: `${config.server}:${config.port}/api/deviceprivatedata/${privateId}`,
      json: true, // Automatically stringifies the body to JSON
      headers: {
        Authorization: `Bearer ${config.jwt}`,
      },
    };

    const data = await rp(options);

    return data.collection;
  } catch (err) {
    config.logr.error(`Error in util.js/getDevicePrivateModel(): ${err}`);
    config.logr.error(`Error stringified: ${JSON.stringify(err, null, 2)}`);
    throw err;
  }
}

// This function updates the expiration date of a devices devicePublicData model.
async function updateExpiration(config, deviceId, timeSelector) {
  try {
    //debugger;

    let targetTime = 0;
    switch (timeSelector) {
      case 0: // Now - force device reset.
        targetTime = 0;
        break;
      case 10: // Testing
        targetTime = 60000 * 8;
        break;
      case 20: // 1 hr
        targetTime = 60000 * 60;
        break;
      case 30: // 1 day
        targetTime = 60000 * 60 * 24;
        break;
      case 40: // 1 week
        targetTime = 60000 * 60 * 24 * 7;
        break;
      case 50: // 1 month
        targetTime = 60000 * 60 * 24 * 30;
        break;
      default:
        targetTime = 0;
    }

    // Get the devicePublicData model.
    let options = {
      method: "GET",
      uri: `${config.server}:${config.port}/api/devices/${deviceId}`,
      json: true,
    };
    const data = await rp(options);

    console.log(
      `Expiration before: ${data.device.expiration}, type: ${typeof data.device.expiration}`
    );

    // Calculate a new expiration date.
    const now = new Date();
    const expirationDate = new Date(now.getTime() + targetTime);
    data.device.expiration = expirationDate.toISOString();

    // Update the devicePublicModel with a new expiration date.
    options = {
      method: "PUT",
      uri: `${config.server}:${config.port}/api/devices/${deviceId}`,
      body: data,
      json: true,
      headers: {
        Authorization: `Bearer ${config.jwt}`,
      },
    };
    const updatedData = await rp(options);

    // Verify that the returned value contains the new date.
    if (updatedData.device.expiration) return true;
    return false;
  } catch (err) {
    config.logr.error(`Error in util.js/updateExpiration(): ${err}`);
    //config.logr.error(`Error stringified: ${JSON.stringify(err, null, 2)}`);
    throw err;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// This function adds a deviceId to the rentedDevice list model.
async function addRentedDevice(config, deviceId) {
  //debugger;

  try {
    const options = {
      method: "GET",
      uri: `${config.server}:${config.port}/api/renteddevices/add/${deviceId}`,
      json: true, // Automatically stringifies the body to JSON
    };

    const data = await rp(options);

    if (!data.success) throw `Could not add device ${deviceId} to rentedDevices list model.`;

    return true;
  } catch (err) {
    config.logr.error(`Error in util.js/addRentedDevice(): ${err}`);
    config.logr.error(`Error stringified: ${JSON.stringify(err, null, 2)}`);
    throw err;
  }
}

// This function removes a deviceId from the rentedDevices list model
async function removeRentedDevice(config, deviceId) {
  //debugger;

  try {
    const options = {
      method: "GET",
      uri: `${config.server}:${config.port}/api/renteddevices/remove/${deviceId}`,
      json: true, // Automatically stringifies the body to JSON
    };

    const data = await rp(options);

    if (!data.success) throw `Could not remove device ${deviceId} from rentedDevices list model.`;

    return true;
  } catch (err) {
    debugger;
    config.logr.error(`Error in util.js/removeRentedDevice(): ${err}`);
    config.logr.error(`Could not remove device ${deviceId} from rentedDevices list model.`);
    config.logr.error(`Error stringified: ${JSON.stringify(err, null, 2)}`);
    throw err;
  }
}

// This function returns an array of devicePublicModel IDs stored in the rentedDevices model.
async function getRentedDevices(config) {
  //debugger;

  try {
    const options = {
      method: "GET",
      uri: `${config.server}:${config.port}/api/renteddevices`,
      json: true, // Automatically stringifies the body to JSON
    };

    const data = await rp(options);

    if (!data.devices) throw `Could not find a list of rented devices on server.`;

    const retVal = data.devices;

    return retVal;
  } catch (err) {
    config.logr.error(`Error in util.js/getRentedDevices(): ${err}`);
    config.logr.error(`Could not retrieve the list of rented devices from the server.`);
    //config.logr.error(`Error stringified: ${JSON.stringify(err, null, 2)}`);
    throw err;
  }
}

// This function gets all the notifications from the OB server.
// It returns a Promise that resolves to an array of NEW notifications.
async function getNewOBNotifications(config) {
  try {
    const allNotifications = await openbazaar.getNotifications(config);

    const newNotifications = [];

    // Exit if no new notifications.
    if (allNotifications.unread === 0) return newNotifications;

    // Read through all notifications and return any that are marked unread.
    for (let i = 0; i < allNotifications.notifications.length; i++) {
      if (!allNotifications.notifications[i].read)
        newNotifications.push(allNotifications.notifications[i]);
    }

    return newNotifications;
  } catch (err) {
    config.logr.error(`Error in util.js/getNewOBNotifications(): ${err}`);
    config.logr.error(`Error stringified: ${JSON.stringify(err, null, 2)}`);
    throw err;
  }
}

// This function marks a notification as read in Open Bazaar.
async function markNotificationAsRead(config) {
  try {
    const noteId = config.obNotice.notification.notificationId;

    const body = {
      notificationId: noteId,
    };

    await openbazaar.markNotificationAsRead(config, body);

    config.logr.debug(`Notification ${noteId} has been marked as 'read'.`);

    return true;
  } catch (err) {
    debugger;
    config.logr.error(`Error in util.js/markNotificationAsRead(): ${err}`);
    config.logr.error(`Error stringified: ${JSON.stringify(err, null, 2)}`);
    config.logr.error(`openbazaar returned: ${data}`);
    throw err;
  }
}

// This function marks an order on OB as 'Fulfilled'. It sends the login
// information needed by the renter to log into the Client device.
async function fulfillOBOrder(config) {
  try {
    // Exit if required data is not included.
    if (config.devicePrivateData == null) return null;

    // This is the information sent to the purchaser.
    const notes = `Host: p2pvps.net
Port: ${config.devicePrivateData.serverSSHPort}
Login: ${config.devicePrivateData.deviceUserName}
Password: ${config.devicePrivateData.devicePassword}
`;

    // Information needed by OB to fulfill the order.
    const bodyData = {
      orderId: config.obNotice.notification.orderId,
      note: notes,
    };

    // Fulfill the order.
    await openbazaar.fulfillOrder(config, bodyData);

    console.log(`OrderId ${config.obNotice.notification.orderId} has been marked as fulfilled.`);

    return true;
  } catch (err) {
    config.logr.error(`Error in util.js/fulfillOBOrder(): ${err}`);
    config.logr.error(`Error stringified: ${JSON.stringify(err, null, 2)}`);
    throw err;
  }
}

// This function remove the associated obContract model from the server,
// This also has the effect of removing the listing from the OB store.
async function removeOBListing(config, deviceData) {
  //console.log(`deviceData: ${JSON.stringify(deviceData, null, 2)}`);
  try {
    const obContractId = deviceData.obContract;

    // Validation/Error Handling
    if (obContractId === undefined || obContractId === null)
      throw `no obContract model associated with device ${deviceData._id}`;

    // Get the contract data before deleting it.
    const obContractModel = await getObContractModel(config, obContractId);
    //console.log(`obContractModel: ${JSON.stringify(obContractModel, null, 2)}`);

    // Delete the actual OB listing.
    await openbazaar.removeListing(config, obContractModel.listingSlug);

    // Delete the obContract model.
    let options = {
      method: "DELETE",
      uri: `${config.server}:${config.port}/api/obcontract/${obContractId}`,
      json: true, // Automatically stringifies the body to JSON
      headers: {
        Authorization: `Bearer ${config.jwt}`,
      },
    };
    const data = await rp(options);

    if (!data.success)
      throw `Could not remove device ${obContractId} from rentedDevices list model.`;

    // Update the devicePublicModel by removing the obContract field.
    const obj = Object.assign({}, deviceData, { obContract: "" });
    //deviceData.obContract = "";
    options = {
      method: "PUT",
      uri: `${config.server}:${config.port}/api/devices/${deviceData._id}`,
      body: { device: obj },
      json: true,
      headers: {
        Authorization: `Bearer ${config.jwt}`,
      },
    };
    const updatedData = await rp(options);

    //console.log(`updatedData: ${JSON.stringify(updatedData, null, 2)}`);
    if (updatedData.device.obContract !== "")
      throw `Could not remove obContract ID from device model.`;

    return true;
  } catch (err) {
    config.logr.error(`Error in util.js/removeOBListing(): ${err}`);
    if (err.statusCode >= 404) {
      //
      config.logr.error(`obContract model could not be found. Skipping.`);
      return false;
    }
    //
    //config.logr.error(`Error stringified: ${JSON.stringify(err, null, 2)}`);

    //throw err;
    return false;
  }
}

// This function returns an obContract model given the model id.
// If the obContract can not be found, it returns false.
async function getObContractModel(config, contractId) {
  try {
    const options = {
      method: "GET",
      uri: `${config.server}:${config.port}/api/obcontract/${contractId}`,
      json: true, // Automatically stringifies the body to JSON
    };

    const data = await rp(options);
    //console.log(`data: ${JSON.stringify(data, null, 2)}`);
    if (data.obContract === undefined) throw `No obContract Model with ID of ${contractId}`;

    return data.obContract;
  } catch (err) {
    if (err.statusCode >= 500) {
      // Model could not be found. (probably already deleted)
      if (err.error.error === "not found") {
        config.logr.error(`util.js/getObContractModel(): obContractModel not found.`);
      } else {
        config.logr.error(
          "util.js/getObContractModel(): Connection to the server was refused. Will try again."
        );
      }
      return false;
    }
    if (err.toString().indexOf(`No obContrct Model`) !== -1) {
      config.logr.error(`Error in util.js/getObContractModel().`);
      //config.logr.error(`Error stringified: ${JSON.stringify(err, null, 2)}`);
      throw err;
    }
  }
}

// This function returns true or false, depending on if the input string matches
// the regular expression, which corresponds to a valid BSON ID. This is the ID
// generated by MongoDB.
function validateGuid(guid) {
  if (typeof guid !== "string") return false; // Error handling.

  const re = /^[a-f\d]{24}$/i;

  return re.test(guid);
}

async function readAdminFile() {
  return new Promise(function(resolve, reject) {
    const filename = `/usr/src/app/auth/system-user-dev.json`;

    fs.readFile(filename, "utf8", function(err, rawdata) {
      if (err) return reject(err);

      const data = JSON.parse(rawdata);
      return resolve(data);
    });
  });
}

// Log into the P2P VPS API as an admin and retrieve the JWT token for making
// API calls.
async function getToken(config) {
  try {
    const options = {
      method: "POST",
      uri: `${config.server}:${config.port}/api/auth`,
      resolveWithFullResponse: true,
      json: true,
      body: {
        username: `${config.adminUser}`,
        password: `${config.adminPass}`,
      },
    };

    const result = await rp(options);

    //console.log(`result: ${JSON.stringify(result, null, 2)}`);

    return result.body.token;
  } catch (err) {
    console.error("Error authenticating user in util.js/getToken().");
    throw err;
  }
}

module.exports = {
  getDevicePublicModel,
  getDevicePrivateModel,
  updateExpiration,
  addRentedDevice,
  removeRentedDevice,
  getRentedDevices,
  getNewOBNotifications,
  markNotificationAsRead,
  fulfillOBOrder,
  removeOBListing,
  getObContractModel,
  validateGuid,
  getToken,
  readAdminFile,
  sleep,
};
