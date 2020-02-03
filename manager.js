const fs = require('fs');
let metaData = undefined;
const prepends = 4;

module.exports = {
  init: (directory, pathToJSON, cb) => {
    initMetaData(directory, pathToJSON, (err, data) => {
      if (err) {
        console.error(err);
        process.exit(-1);
      } else {
        cb();
      }
    });
  },

  getCurrentFileName: (directory, pathToJSON) => {
    const fileNumber = metaData.fileCounter++;
    return prepareFileName(String(fileNumber));
  },

  addNewTemplate: (pathToJSON, data) => {
    metaData.directory.push(data);
    writeMetaData(pathToJSON);
  },

  checkClash: (name) => {
    return metaData.directory.some(element => element.name === name);
  },

  getTemplateFileName: (name) => {
    return metaData.directory.find(element => element.name === name)
      .file;
  }
}

function writeMetaData(pathToJSON) {
  fs.writeFile(pathToJSON, JSON.stringify(metaData), err => {
    if (!err) {
      console.log('Successfully added new template!');
    } else {
      console.log('Error writing template!');
    }
  });
}

function prepareFileName(str) {
  let prepends = '';
  if (str.length < 4) {
    const neededZeros = (4 - str.length);
    for (let i = 0; i < neededZeros; i++) {
      prepends += '0';
    }
  }
  return `${prepends}${str}.tpl`;
}

// MetaData Creation/Access
function initMetaData(directory, pathToJSON, cb) {
  if (metaData) {
    cb(undefined);
  } else {
    fs.access(pathToJSON, fs.constants.F_OK, err => {
      if (err) {
        fs.access(directory, fs.constants.F_OK, err => {
          const newData = {
            fileCounter: 1,
            directory: []
          }
          if (err) {
            fs.mkdir(directory, err => {
              if (err) {
                cb(new Error(`Could not Initialize Bakery: Failed to created folder at ${directory}`));
              } else {
                fs.writeFile(pathToJSON, JSON.stringify(newData), err => {
                  if (err) {
                    cb(new Error(`Could not Initialize Bakery: Failed to create JSON ${pathToJSON}`));
                  } else {
                    metaData = {
                      ...newData
                    }
                    cb(undefined);
                  }
                });
              }
            });
          } else {
            fs.writeFile(pathToJSON, JSON.stringify(newData), err => {
              if (err) {
                cb(new Error(`Could not Initialize Bakery: Failed to create JSON ${pathToJSON}`));
              } else {
                metaData = {
                  ...newData
                }
                cb(undefined)
              }
            });
          }
        });
      } else {
        fs.readFile(pathToJSON, (err, data) => {
          if (!err) {
            metaData = JSON.parse(data);
            cb(undefined, JSON.parse(data));
          } else {
            cb(new Error(`Could not read file ${pathToJSON}`));
          }
        });
      }
    });
  }
}