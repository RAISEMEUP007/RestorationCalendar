const {app, BrowserWindow, Menu, ipcMain, shell, nativeImage, Tray} = require('electron');
const fs = require('fs');
const { debuglog } = require('util')
const { Notification } = require('electron')
const { remote } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const iconPath = path.join(__dirname, 'icon.ico');

let needExit = false;

let db = new sqlite3.Database('./database.db');
// const notifier = require('node-notifier');

// require('electron-reload')(__dirname, {
//   electron: require(`${__dirname}/node_modules/electron`)
// });

app.setName('Restoration Calendar');

const menuTemplate = [
  {
    label: 'Print',
    click: () => {
      mainWindow.webContents.executeJavaScript('allPrint()');
    }
  },
  {
    label: 'Exit',
    // accelerator: 'CmdOrCtrl+x',
    click: () => {
      // needExit = true;
      app.quit();
    }
  },
  // {
  //   label: 'console',
  //   click: () => {
  //     mainWindow.webContents.openDevTools();
  //   }
  // }
];

// Create the menu from the template
const menu = Menu.buildFromTemplate(menuTemplate);

// Set the application menu
Menu.setApplicationMenu(menu);

// Set Notification Type
const CustomNotyTypes = ['Event', 'Task', 'Reminder'];

let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 700,
    icon: path.join(__dirname, 'icon.jpg'),/*[
      path.join(__dirname, 'icon.png'),
      path.join(__dirname, 'icon-16.png'),
      path.join(__dirname, 'icon-32.png'),
      path.join(__dirname, 'icon-64.png'),
      path.join(__dirname, 'icon-128.png'),
    ],*/
    webPreferences: {
      nodeIntegration: true,
      allowPrinting: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    'auto-hide-menu-bar': true,
    // title: "Restoration Calendar",
  });
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  
  mainWindow.on('close', function(event) {
    if (needExit == false) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  
  let tray = new Tray(iconPath);
  tray.setToolTip('Restoration Calendar');
  let contextMenu = Menu.buildFromTemplate([
    { label: 'Show', type: 'normal', click: () => {
      mainWindow.show();
    }},
    { type: 'separator' },
    { label: 'Quit', type: 'normal', click: () => 
      {
        needExit = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);

  showNotification();
  setInterval(showNotification, 1000);
  
// mainWindow.webContents.openDevTools();
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // Another instance of the app is already running, so exit
  needExit = true;
  app.quit();
} else {
  // Create a new window for the first instance of the app
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance of the app, so focus the first instance's window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (mainWindow.isVisible() == false) mainWindow.show();
      mainWindow.focus();
    }
  });
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Check if the table already exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='tbl_noty'", function(err, row) {
    if (err) {
      const { dialog } = electron;
      dialog.showMessageBox({
        type: 'info',
        title: 'Error',
        message: 'Database is invalid.\nThe program will close.',
        buttons: ['OK']
      }, function() {
        needExit = true;
        app.quit();
      });
    } else if (!row) {
      // Create the table schema if it doesn't exist
      db.run('CREATE TABLE tbl_noty (id INTEGER,notytitle TEXT,notytype INTEGER,notydate TEXT,notytime TIME,notydesc TEXT,repeatevery INTEGER,repeatdwmy INTEGER,repeatweekon TEXT,repeatendtype INTEGER,repeatendday DATE,repeatendoccurrences INTEGER,calendartype INTEGER,PRIMARY KEY(id))');
    }
  });
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// app.on('window-all-closed', function () {
  // if (process.platform !== 'darwin') app.quit();
// });

app.on('quit', function () {
  if (needExit) {
    db.close();
  }
});

ipcMain.on('registerNotyInfo', (event, data) => {
  let repeatWeekon = "";
  for (let i=0; i<data.repeatInfo.weekdayon.length; i++) {
    repeatWeekon += data.repeatInfo.weekdayon[i] + ",";
  }
  if(data.id) {
    db.run('UPDATE tbl_noty SET notytitle=?, notytype=?, notydate=?, notytime=?, notydesc=?, repeatevery=?, repeatdwmy=?, repeatweekon=?, repeatendtype=?, repeatendday=?, repeatendoccurrences=?, calendartype=? WHERE id=?', [data.title, data.type, data.date, data.time, data.desc, data.repeatInfo.every, data.repeatInfo.dwmy, repeatWeekon, data.repeatInfo.endtype, data.repeatInfo.endday, data.repeatInfo.endoccurrences, data.calendartype, data.id], function(err) {
      if (err) {
        event.sender.send('errorInfo', err);
      } else {
        db.get("SELECT * FROM tbl_noty WHERE id=" + data.id, function(err, row) {
          if (row) {
            event.sender.send('registerNotyInfo', row);
          }
        });
      }
    });
  }
  else {
    // Insert a new row into the table
    var newId = 0;
    db.get("SELECT max(id) as maxId FROM tbl_noty", function(err, row) {
      if (row) {
        newId = row.maxId;
      }
      newId++;
      db.run('INSERT INTO tbl_noty (id, notytitle, notytype, notydate, notytime, notydesc, repeatevery, repeatdwmy, repeatweekon, repeatendtype, repeatendday, repeatendoccurrences, calendartype) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [newId, data.title, data.type, data.date, data.time, data.desc, data.repeatInfo.every, data.repeatInfo.dwmy, repeatWeekon, data.repeatInfo.endtype, data.repeatInfo.endday, data.repeatInfo.endoccurrences, data.calendartype], function(err) {
        if (err) {
          console.error(err.message);
        } else {
          var lastId = this.lastID;
          db.get("SELECT * FROM tbl_noty WHERE id=" + lastId, function(err, row) {
            if (row) {
              event.sender.send('registerNotyInfo', row);
            }
          });
          
          // notifier.notify({
          //   title: CustomNotyTypes[data.type] + " : " + data.title,
          //   message: data.desc + " ",
          //   icon: nativeImage.createFromPath(path.join(__dirname, 'resources', 'icon.png')),
          //   timeoutType: 'custom',
          //   timeout: 5000 // Display the notification for 5 
          // });
        }
      });
    });
  }
});
  
ipcMain.on('removeNotyInfo', (event, data) => {
  db.run('DELETE FROM tbl_noty WHERE id=?', [data.id], (err) => {
    if (err) {
      console.log(err);
    } else {
      event.sender.send('removeNotyInfo', {});
    }
  });
});

ipcMain.on('getNotyList', (event) => {
  var sqlStr = "SELECT * FROM tbl_noty";
  db.all(sqlStr, function(err, rows) {
    if (rows) {
      event.sender.send('getNotyList', rows);
    }
  });
});

ipcMain.on('getOneNotyInfo', (event, data) => {
  db.get("SELECT * FROM tbl_noty WHERE id=" + data.id, function(err, row) {
    if (row) {
      event.sender.send('getOneNotyInfo', row);
    }
  });
});

function showNotification() {
  var cDateObj = new Date();
  cDate = cDateObj.toLocaleDateString('sv-SE');
  cTime = cDateObj.toLocaleTimeString('sv-SE');
  cDay = cDateObj.getDay();
  //to process custom calendar notification, currenct date convert custom date object
  custCurDate = new ConvertGregorianToCustom(cDateObj.getFullYear(), cDateObj.getMonth() + 1, cDateObj.getDate());
  //filter as current time.
  // var sqlStr = "SELECT * FROM tbl_noty WHERE strftime('%H:%M:00', notytime)='" + cTime + "' AND (strftime('%Y-%m-%d', notydate)='" + cDate + "')";
  var sqlStr = "SELECT * FROM tbl_noty WHERE strftime('%H:%M:00', notytime)='" + cTime + "'";
  db.all(sqlStr, function(err, rows) {
    if (rows) {
      for (var i=0; i<rows.length; i++) {
        let isValid = true;
        let remainOccurrence = -1;
        let notyDate = new Date(rows[i].notydate+" 1:0:0");
        //to process custom calendar notification, notification date convert custom date object
        custNotiDate = new ConvertGregorianToCustom(notyDate.getFullYear(), notyDate.getMonth() + 1, notyDate.getDate());
        //if current date is less than notification date, this is invalid.
        // if (cDate < notyDate.toLocaleDateString('sv-SE')) {
        //   console.log("No repeat condition: noty date");
        //   isValid = false;
        //   continue;
        // }
        //evaluate repeat end condition.
        if (rows[i].repeatendtype == 1) {
          //evaluate end date
          let endDate = new Date(rows[i].repeatendday+" 1:0:0");
          if (cDate > endDate.toLocaleDateString('sv-SE')) {
            console.log("No repeat condition: end date");
            isValid = false;
            continue;
          }
        }
        let repeatEvery = parseInt(rows[i].repeatevery);
        if (isNaN(repeatEvery)) repeatEvery = 0;
        console.log(cDateObj,notyDate);
        if (repeatEvery < 1) {//this case deals with norepeat notification
          if (cDateObj.getFullYear() != notyDate.getFullYear() || cDateObj.getMonth() != notyDate.getMonth() || cDateObj.getDate() != notyDate.getDate()) {
            console.log("No repeat condition: no condition but no correct date");
            isValid = false;
            continue;
          }
        }
        else {//this case deals with repeat notification
          //evaluate repeat type (week, month, year, day)
          let repeatType = rows[i].repeatdwmy;
          if (repeatType == 2) {// week condition
            console.log('week condition checking..............');
            let weekdays = rows[i].repeatweekon.split(",");

            if (rows[i].calendartype==0) {//gregorian calendar
              if (weekdays.indexOf(cDay + '') == -1) {
                console.log("No repeat condition: week");
                console.log(cDay + '', weekdays);
                isValid = false;
                continue;
              }
              let diffW = Math.floor((cDateObj.getTime()/24/3600/1000-cDateObj.getDay()+7)/7) - Math.floor((notyDate.getTime()/24/3600/1000-notyDate.getDay()+7)/7);
              console.log(diffW, repeatEvery);
              if (diffW % repeatEvery) {
                console.log("No repeat condition: week-every");
                isValid = false;
                continue;
              }
            }
            else {
              //custom calendar
              if (weekdays.indexOf((custCurDate.day - 1) % 10 + '') == -1) {
                isValid = false;
                continue;
              }
              custNotyDate = new ConvertGregorianToCustom(notyDate.getFullYear(), notyDate.getMonth() + 1, notyDate.getDate());
              let diffW = Math.floor((custCurDate.month * 10 + custCurDate.day - 1) / 10) - Math.floor((custNotyDate.month * 10 + custNotyDate.day - 1) / 10);
              if (diffW % (repeatEvery)) {
                continue;
              }
            }
              
            console.log('week->occurrence condition checking');
            if (rows[i].repeatendtype == 2) {
              //evaluate occurrences
              let occurrences = parseInt(rows[i].repeatendoccurrences);
              if (isNaN(occurrences)) occurrences = 0;
              if (occurrences <= 0) {
                console.log("No repeat condition: occurrences");
                isValid = false;
                continue;
              } else {
                remainOccurrence = occurrences - 1;
              }
            }
            console.log('week condition passed........');
          }
          else if (repeatType == 4) {// year condition ----------- checked
            if (rows[0].calendartype==0) {//gregorian calendar notification
              if (notyDate.getMonth() != cDateObj.getMonth() || notyDate.getDate() != cDateObj.getDate()) {
                console.log("No repeat condition: year-diff: md");
                isValid = false;
                continue;
              }
              let diffY = cDateObj.getFullYear() - notyDate.getFullYear();
              if (diffY % repeatEvery) {
                console.log("No repeat condition: year-every");
                isValid = false;
                continue;
              }
            }
            else {//custom calendar notification
              if (custCurDate.month != custNotiDate.month || custCurDate.day != custNotiDate.day) {
                console.log("No repeat condition: year-diff: md");
                isValid = false;
                continue;
              }
              let diffY = custCurDate.year - custNotiDate.year;
              if (diffY % repeatEvery) {
                console.log("No repeat condition: year-every");
                isValid = false;
                continue;
              }
            }
              
            if (rows[i].repeatendtype == 2) {
              //evaluate occurrences
              let occurrences = parseInt(rows[i].repeatendoccurrences);
              if (isNaN(occurrences)) occurrences = 0;
              if (occurrences <= 0) {
                console.log("No repeat condition: occurrences");
                isValid = false;
                continue;
              } else {
                remainOccurrence = occurrences - 1;
              }
            }
          }
          else if (repeatType == 3) {// month condition   --------------- checked
            console.log('month condition checking.....');
            if (rows[i].calendartype == 0) {//gregorian calendar notification
              console.log(notyDate, cDateObj);
              if (notyDate.getDate() != cDateObj.getDate()) {
                console.log("No repeat condition: month-diff: d");
                isValid = false;
                continue;
              }
              let diffM = cDateObj.getFullYear() * 12 + cDateObj.getMonth() - notyDate.getFullYear() * 12 - notyDate.getMonth();
              console.log(diffM, repeatEvery);
              if (diffM % repeatEvery) {
                console.log("No repeat condition: month-every");
                isValid = false;
                continue;
              }
              console.log("month condition passed....");
            }
            else {//custom calendar notification
              if (custCurDate.month != custNotiDate.month) {
                console.log("No repeat condition: month-diff: d");
                isValid = false;
                continue;
              }
              let diffM = custCurDate.year * 12 + custCurDate.month - custNotiDate.year * 12 - custNotiDate.month;
              console.log(diffM, repeatEvery);
              if (diffM % repeatEvery) {
                console.log("No repeat condition: month-every");
                isValid = false;
                continue;
              }
              console.log("month condition passed....");
            }
              
            if (rows[i].repeatendtype == 2) {
              //evaluate occurrences
              let occurrences = parseInt(rows[i].repeatendoccurrences);
              if (isNaN(occurrences)) occurrences = 0;
              if (occurrences <= 0) {
                console.log("No repeat condition: occurrences");
                isValid = false;
                continue;
              } else {
                remainOccurrence = occurrences - 1;
              }
            }
          } else if (repeatType == 1) {// day condition
            if (rows[i].calendartype==0) {//gregorian calendar notification
              if (notyDate.getDay() != cDateObj.getDay()) {
                console.log("No repeat condition: day-diff");
                isValid = false;
                continue;
              }
              cDateObj.setHours(1);notyDate.setHours(1);
              cDateObj.setMinutes(1);notyDate.setMinutes(1);
              cDateObj.setSeconds(1);notyDate.setSeconds(1);
              cDateObj.setMilliseconds(1);notyDate.setMilliseconds(1);
              let diffD = (cDateObj.getTime() - notyDate.getTime()) / 24 / 3600 / 1000;
              if (diffD % (repeatEvery * 7)) {
                console.log("No repeat condition: day-every");
                console.log(cDateObj, notyDate, diffD);
                isValid = false;
                continue;
              }
            }
            else {//custom calendar notification
              if (custCurDate.day != custNotiDate.day) {
                console.log("No repeat condition: day-diff");
                isValid = false;
                continue;
              }
              let diffD = custCurDate.day - custNotiDate.day;
              if (diffD % (repeatEvery * 10)) {
                isValid = false;
                continue;
              }
            }
            
            if (rows[i].repeatendtype == 2) {
              //evaluate occurrences
              let occurrences = parseInt(rows[i].repeatendoccurrences);
              if (isNaN(occurrences)) occurrences = 0;
              if (occurrences <= 0) {
                console.log("No repeat condition: occurrences");
                isValid = false;
                continue;
              } else {
                remainOccurrence = occurrences - 1;
              }
            }
          }
        }

        // console.log("Noty will be appear");
        //register as system notification
        if (isValid) {
          let nBody = rows[i].notydesc;
          if (nBody == "") nBody = " ";

          const notification = {
            title : CustomNotyTypes[rows[i].notytype] + ": " + rows[i].notytitle,
            body : nBody,
            timeoutType : 'default',
            timeout : 5000,
            appName : 'Restoration Calendar',
            icon : nativeImage.createFromPath(path.join(__dirname, 'resources', 'icon.png'))
          }
          
          new Notification(notification).show();
          // notifier.notify({
          //   title: CustomNotyTypes[rows[i].notytype] + " : " + rows[i].notytitle,
          //   message: rows[i].notydesc + " ",
          //   // icon: nativeImage.createFromPath(path.join(__dirname, 'resources', 'icon.png')),
          //   timeoutType: 'custom',
          //   timeout: 5000 // Display the notification for 5 
          // });

          // if (remainOccurrence != -1) {
          //   //occurrence is reduced as 1
          //   db.run('UPDATE tbl_noty SET repeatendoccurrences=? WHERE id=?', [remainOccurrence, rows[i].id], function(err) {
          //   });
          //   // 
          // }
        }
      }
    }
  });
}

function ConvertGregorianToCustom(year, month, day) {
  var offDays = 16049*360;
  var offTimestamp = offDays * 24 * 3600 * 1000;
  var ajustDate = new Date(2023, 5, 14, 1, 0, 0);
  var baseDate = new Date(ajustDate.getTime() - offTimestamp);
  var curDate = new Date(year, month - 1, day, 1, 0, 0);
  var gregorianOffset = curDate.getTime() - baseDate.getTime();
  var custOffsetDays = Math.floor(gregorianOffset / 1000 / 3600 / 24);
  var custOffsetYear = Math.floor(custOffsetDays / 360);
  var custOffsetMonth = Math.floor((custOffsetDays - custOffsetYear * 360) / 30);
  var custOffsetDay = custOffsetDays - custOffsetYear * 360 -  custOffsetMonth * 30;
  custYear = custOffsetYear + 1;
  custMonth = custOffsetMonth + 1;
  custDay = custOffsetDay + 1;

  this.year = custYear;
  this.month = custMonth;
  this.day = custDay;
}
