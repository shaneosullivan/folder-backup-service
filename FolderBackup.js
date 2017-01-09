var fs = require("fs-extra");

var IGNORE = {
  '.DS_Store': 1,
  '.': 1,
  '..': 1,
}

function getPath(folder, file) {
  return folder + '/' + file;
}

function moveFile(path, srcPath, destPath) {
  var moveToPath = destPath + path.substring(srcPath.length);
  fs.move(path, moveToPath, {clobber: true,}, (err) => {
    if (err) {
      console.log('Failed to move ', path, err);
    }
  });
}

function srcToDestPath(path, srcPath, destPath) {
  return destPath + path.substring(srcPath.length);
}

function copyFile(path, srcPath, destPath) {
  var copyToPath = srcToDestPath(path, srcPath, destPath);
  fs.copy(path, copyToPath, {clobber: true,}, (err) => {
    if (err) {
      console.log('Failed to copy ', path, err);
    }
  });
}

var folderCount = 0;
function folderCallback(srcPath) {
  if (folderCount === 0) {
    fs.readdir(srcPath, null, (err, files) => {
      files.forEach(file => {
        try {
          if (IGNORE[file]) {
            return;
          }

          var path = getPath(srcPath, file);
          var stat = fs.statSync(path);

          if (stat.isDirectory()) {
            console.log('Removing ', path);
            fs.remove(path, (err) => {
              if (err) {
                console.log('Error (1): could not remove folder', path);
              }
            });
          }
        } catch (e) {
          // Probably just that this is a file, which was already moved
          // console.log('Error: (2) File ', file);
        }
      });
    });
  }
}

var movedPaths = {};

function processFolder(folder, srcPath, destPath, isCopy) {
  folderCount++;

  var files = fs.readdir(folder, null, (err, files) => {
    files.forEach(file => {
      try {
        if (IGNORE[file]) {
          return;
        }

        var path = getPath(folder, file);
        var stat = fs.statSync(path);

        movedPaths[path] = 1;

        if (stat.isDirectory()) {
          // Make sure empty folders copy too
          fs.ensureDir(srcToDestPath(path, srcPath, destPath), () => {
            processFolder(path, srcPath, destPath, isCopy);
          });
        } else {
          if (isCopy) {
            copyFile(path, srcPath, destPath);
          } else {
            moveFile(path, srcPath, destPath);
          }
        }
      } catch (e) {
        console.log('Error (3):', e);
      }
    });
    folderCount--;
    if (!isCopy) {
      folderCallback(srcPath);
    }
  });
}

function validateInput(srcPath, destPath, callback) {
  var mode = fs.constants.R_OK | fs.constants.W_OK;

  fs.access(srcPath, mode, (err) => {
    if (err) {
      callback('Cannot access folder ' + srcPath);
    } else {
      callback();
    }
  });
}

module.exports = (srcPath, destPath, isCopy) => {
  validateInput(srcPath, destPath, (err) => {
    if (err) {
      console.log(err);
    } else {
      processFolder(srcPath, srcPath, destPath, !!isCopy);
    }
  });
}
