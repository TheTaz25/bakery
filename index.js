// Initial requires
const commander = require('commander');
const path = require('path');
const homedir = require('os')
  .homedir();
const fs = require('fs');
const zlib = require('zlib');
const manager = require('./manager.js');

// Base paths
const templateFolder = path.join(homedir, '.bakery');
const registryFile = path.join(templateFolder, '.templates.json');

// Init commander
const program = new commander.Command();
program.version('0.1.0');

program
  .command('add <source> <name>')
  .description('Add a new template based on an existing file')
  .action((source, name) => {
    if (manager.checkClash(name)) {
      console.log('Specified Template-Name does already exist!');
      process.exit(-1);
    }

    const newName = manager.getCurrentFileName(templateFolder, registryFile);
    const newData = {
      file: newName,
      name: name
    };

    // Check if file really exists
    fs.access(source, fs.constants.F_OK | fs.constants.R_OK, err => {
      if (!err) {
        fs.copyFile(source, path.join(templateFolder, newName), err => {
          if (!err) {
            manager.addNewTemplate(registryFile, newData);
          } else {
            console.log(err);
            process.exit(-1);
          }
        });
      } else {
        console.log(err);
        process.exit(-1);
      }
    });
  });

program
  .command('bake <templatename> <filename>')
  .description('Create a file based on an existing template')
  .action((templatename, filename) => {
    const pathname = path.join(__dirname, filename);
    if (manager.checkClash(templatename)) {
      fs.access(pathname, fs.constants.F_OK, err => {
        if (err) {
          // Write new file
          const source = path.join(templateFolder, manager.getTemplateFileName(templatename));
          fs.copyFile(source, pathname, err => {
            if (err) {
              console.log(`Could not create file ${pathname}!`);
              process.exit(-1);
            }
          });
        } else {
          console.log(`File ${pathname} does already exist!`);
          process.exit(-1);
        }
      });
    } else {
      console.log(`No template found for name ${templatename}`);
      process.exit(-1);
    }
  });

program
  .command('inject <templatename> <inputfile>')
  .option('-l, --line <number>', 'Specify the line to insert at. Values that begin with a dot will start counting lines from the end. Overflows will append at the end')
  .description('Inject the contents of an existing template into an existing file')
  .action((templatename, inputfile, {
    line
  }) => {
    const pathname = path.join(__dirname, inputfile);
    if (manager.checkClash(templatename)) {
      fs.access(pathname, fs.constants.F_OK | fs.constants.W_OK, err => {
        if (!err) {
          const templatepath = path.join(templateFolder, manager.getTemplateFileName(templatename));
          fs.readFile(templatepath, (err, data) => {
            if (!err) {
              if (!line) {
                fs.appendFile(pathname, "\n" + data, err => {
                  if (err) {
                    console.log(`Could not append template ${templatename} to file ${pathname}!`);
                    process.exit(-1);
                  }
                })
              } else {
                let writeLine = line;
                fs.readFile(pathname, (err, writeData) => {
                  if (!err) {
                    let dataArray = writeData.toString()
                      .split("\n");
                    const insertData = data.toString()
                      .split("\n");
                    console.log(typeof writeLine);
                    if (typeof writeLine === 'string' && writeLine.includes('.')) {
                      writeLine = writeLine.slice(1);
                      writeLine = dataArray.length - writeLine;
                    }
                    dataArray.splice(writeLine, 0, ...insertData);
                    fs.writeFile(pathname, dataArray.join("\n"), err => {
                      if (err) {
                        console.log(`Could not write data into file`);
                        process.exit(-1);
                      }
                    });
                  } else {
                    console.log(`Error reading data`);
                    process.exit(-1);
                  }
                })
              }
            } else {
              console.log(`Error during read of template ${templatename}!`);
              process.exit(-1);
            }
          });
        } else {
          console.log(`File ${pathname} does not exist!`);
          process.exit(-1);
        }
      });
    } else {
      console.log(`No template found for name ${templatename}`)
      process.exit(-1);
    }
  });

program
  .command('import')
  .description('Import templates from an existing export')
  .action(() => {
    fs.access('./.templates.json', fs.constants.F_OK | fs.constants.R_OK, err => {
      if (err) {
        console.log(`No './templates.json' found in current directory, stoping import`);
        process.exit(1);
      } else {
        fs.readFile('./.templates.json', (err, data) => {
          console.log(data);
        });
      }
    });
  });

program
  .command('clean')
  .description('Clean Bakery-Cache! (On your own responsibility...)')
  .action(() => {

  });

manager.init(templateFolder, registryFile, () => {
  program.parse(process.argv);
});