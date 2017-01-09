# folder-backup-service
folder-backup-service empties one or more folders, moving the contents into another folder, keeping it empty at all times. It can be installed as a service on a Mac to run continuously.

The idea behind this is that it can be used to consolidate files from multiple places into one or more folders.  For example, if your phone automatically syncs photos to Dropbox, and you'd like to keep the amount stored on Dropbox to a minimum, this service can automatically check the "Camera Uploads" folder every minute, and move all it's contents to a folder on your computer that you specify.  The same could be done with the semi-hidden folder that the Photos app uses, so you don't have to search in a hidden place for your photos every time you sync your iPhone with your Mac.

To use this, you'll need Node installed, if you do not already - https://nodejs.org/en/download/

## Installation
Either checkout this code with git 
  git clone https://github.com/shaneosullivan/folder-backup-service.git

or download the ZIP from https://github.com/shaneosullivan/folder-backup-service/archive/master.zip and extract it.

## Usage

First, execute the run.js file on the command line.  If it's not executable for some reason, do

chmod +x run.js

to make it runnable.

The first time you run it, a file will be generated that lists the folders you want to back up, called 'config', in the same folder as run.js.  Edit this file to specify the folders.  Each line contains two folder paths, separated by a ':'.  The first folder is the source, where files will be removed from.  The second folder is the destination.

When files are copied over, they maintain the folder structure.

Once you've updated the config file, you can execute run.js again, and it'll move the files, but just once.  If you'd like to just test it out, copying the files instead of moving them, execute

run.js -t

To run it continuously, where it checks the source folder once per minute, and moves the files to the destination folder, execute

run.js -c

However this will not survive the terminal being closed or the computer being restarted.  To install this as a service on a Mac (Mac only for now), execute

run.js --install

which will run it continually in the background, and start up again when the computer is rebooted.

To stop the service, execute

run.js --uninstall

To see these options, execute

run.js --help
