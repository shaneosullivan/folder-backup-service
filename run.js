#!/usr/bin/env node

var FolderBackup = require('./FolderBackup');
var fs = require('fs-extra');
var exec = require('child_process').exec;

const NO_CONFIG_MESSAGE = 'Config not set. Please edit the "config" file in this folder';
const CONFIG_FILE = './config';
const CONFIG_TEMPLATE_FILE = './templates/_configTemplate';
const INSTALLATION_TEMPLATE = './templates/_MacServiceTemplate';
const INSTALLATION_FILE = 'com.chofter.folderbackup.application.plist';
const INSTALLATION_DESTINATION = process.env.HOME + '/Library/LaunchAgents/' + INSTALLATION_FILE;
const TIMEOUT = 60000;

let isContinuous = false;
let isCopy = false;
let isHelpOnly = false;
let isInstall = false;

// Process input arguments
process.argv.forEach(function (val, index, array) {
  switch(val) {
    case '-c':
      isContinuous = true;
      break;
    case '-t':
      isCopy = true;
      break;
    case '--h':
    case '--help':
      isHelpOnly = true;
      printHelp();
      break;
    case '--install':
      isInstall = true;
      uninstallAsServiceOnMac(installAsServiceOnMac);
      break;
    case '--uninstall':
      isInstall = true;
      uninstallAsServiceOnMac();
      break;
  }
});

function printHelp() {
  console.log('This script moves files from one folder to another, specified in the config file\n' +
    '--help shows this message\n' +
    '-c run this script continuously, every minute\n' +
    '-t test run, only copy the files, do not remove from the source folder' +
    '--install Install this as a service on the Mac to always run' +
    '--uninstall Uninstall this service on the Mac'
  );
}

function installAsServiceOnMac() {
  fs.open(INSTALLATION_TEMPLATE, 'r', (err) => {
    if (err) {
      console.log('Could not install service, unable to open installation template');
      return;
    }
    fs.readFile(INSTALLATION_TEMPLATE, (err, data) => {
      if (err) {
        console.log('Could not install service, unable to open installation template');
        return;
      } else {
        var currentFolder = process.cwd();
        data = data.toString();

        // replace working folder
        data = data.split('{workingfolder}').join(currentFolder);

        // replace script folder
        data = data.split('{scriptfolder}').join(currentFolder);

        fs.open(INSTALLATION_DESTINATION, 'w', (err) => {
          if (err) {
            console.log('Could not install service, please run as sudo');
            return;
          }
          fs.writeFile(INSTALLATION_DESTINATION, data, (err, data) => {
            if (err) {
              console.log('Could not install service, please run as sudo');
              return;
            }
            exec('launchctl load ' + INSTALLATION_DESTINATION, (err) => {
              if (err) {
                console.log('Could not install service', err);
              } else {
                exec('launchctl start ' + INSTALLATION_FILE, (err) => {
                  if (err) {
                    console.log('Could not install service (6): ', err);
                  } else {
                    console.log('Installed the service. It will now run continuously, even after you ' +
                      'restart your computer.  To stop this, run this script again with the --uninstall flag')
                  }
                });
              }
            });
          });
        });
      }
    });
  });
}

function uninstallAsServiceOnMac(callback) {
  exec('launchctl unload ' + INSTALLATION_DESTINATION, (err) => {
    if (callback) {
      callback();
    } else {
      if (err) {
        console.log('Could not uninstall service');
      } else {
        console.log('Uninstalled the service');
      }
    }
  });
}

// Execute the process to move or copy the files.
function run() {
  fs.open(CONFIG_FILE, 'r', (err) => {
    if (err) {
      fs.copy(CONFIG_TEMPLATE_FILE, CONFIG_FILE, function (err) {
        if (err) {
          console.log('Unable to create config. Please either make the' +
            ' folder writeable, or run with sudo');
        } else {
          console.log(NO_CONFIG_MESSAGE);
        }
      });
      return;
    }

    fs.readFile(CONFIG_FILE, (err, data) => {
      if (err) {
        console.log('Unable to access config. Please run with sudo');
        return;
      } else {
        processConfig(data.toString());
      }
    });
  });
}

function processConfig(data) {
  var lines = data.split('\n').filter(line => {
    line = line.trim();
    return line.length > 0 && line.indexOf('#') < 0 && line.indexOf(':') > 0;
  });

  if (lines.length === 0) {
    console.log('No folders listed in the config file.\n' +
      'See the _configTemplate file for an example of how to do this.')
    return;
  }

  lines.forEach(line => {
    var parts = line.split(':');
    var srcPath = parts[0].trim();
    var destPath = parts[1].trim();

    if (!srcPath || !destPath) {
      console.log('Invalid folder: source folder "' + srcPath +
        '", destination folder "' + destPath + '"');
    } else {
      FolderBackup(srcPath, destPath, isCopy);
      console.log((isCopy ? 'Copied' : 'Moved') +
        ' files from ' + srcPath + ' to ' + destPath);
    }
  });
}

if (!isHelpOnly && !isInstall) {
  if (isContinuous) {
    setInterval(() => {
      run();
    }, TIMEOUT);
  }

  run();
}
