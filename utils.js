const fs = require('fs');

module.exports = {
  fileExists: (pathToFile, ok) => {
    fs.access(path, fs.F_OK, err => {
      if (err) {
        console.log(`Could not find file ${pathToFile}, stoping execution...`);
        process.exit(1);
      }
      ok()
    })
  }
}