const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const fs=require('fs');
const path = require('path');
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
const os = require('os');
const Menu = require('electron').Menu
const MenuItem = require('electron').MenuItem
const autoUpdater = require('electron').autoUpdater;
var child_spawn = require('./screenJs');
var UserInfo = require('./saveUserData');
var dowReq = require("request");
var desktop = null;
// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}


const UPDATE_SERVER_HOST = '192.168.60.158:1337'
const version = app.getVersion();
console.log('change_log'+process.version);
console.log("os.arch"+os.arch());
 arch =os.arch();
if(os.arch()=='ia32'){

 arch ='x64';

}
//=====================================================
   // autoUpdater.on('update-available', () => {

   //   console.log("A new update is available")
   //  })
   //  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
   //    //notify("A new update is ready to install", `Version ${releaseName} is downloaded and will be automatically installed on Quit`)
   //  })
   //  autoUpdater.on('error', (error) => {
   //    console.log(error)
   //  })
   //  autoUpdater.on('checking-for-update', (event) => {
   //    console.log("checking-for-update")
   //  })
   //  autoUpdater.on('update-not-available', () => {
   //    console.log("update-not-available")
   //  })
   //  autoUpdater.setFeedURL(`http://${UPDATE_SERVER_HOST}/update/${process.platform}_${arch}/${version}`);
   //  autoUpdater.checkForUpdates();
//==================================================================
function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }
  
  const ChildProcess = require('child_process');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };


  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      spawnUpdate(['--createShortcut', exeName]);
      //app.quit();
      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      spawnUpdate(['--removeShortcut', exeName]);
      app.quit()
      //setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':

      app.quit();
      return true;
  }
};




  
//====================================
  var mainDir="";        //当前根目录

  var ppapi_flash_path="";
  if(process.platform  == 'win32'){
  console.log("win32");
  ppapi_flash_path = path.join(__dirname, '/flash/pepflashplayer.dll');
   if(ppapi_flash_path.indexOf("resource")!=-1){

    var arr = ppapi_flash_path.split("resource");
	  mainDir = arr[0];
    ppapi_flash_path =path.join(arr[0],'flash/pepflashplayer.dll');
  }
  } else if (process.platform == 'linux') {
  console.log("linux");
  ppapi_flash_path = path.join(__dirname, 'libpepflashplayer.so');
 
  } else if (process.platform == 'darwin') {
  console.log("darwin");
  ppapi_flash_path = path.join(__dirname, 'PepperFlashPlayer.plugin');
  }
 
try{
  
  app.commandLine.appendSwitch('ppapi-flash-path',ppapi_flash_path);
  //设置flash版本
  app.commandLine.appendSwitch('ppapi-flash-version', '21.0.0.209');
  
  app.commandLine.appendSwitch('ignore-certificate-errors');  

}catch(e){

  console.log("__________"+e);
}

var config = {};


function initWebFrame(config){
    var url = config['loginUrl']?config['loginUrl']:config['url'];
    var devtol = config['devtol'];
    var menu = config['menu'];

    const options = {"extraHeaders" : "pragma: no-cache\n"}
    win.loadURL(`file://${__dirname}/index.html`,options);
	
	//`file://${__dirname}/index.html`
    var ses = win.webContents.session;
	   ses.clearCache(function(){
		   
	 });
	
    if(devtol) win.webContents.openDevTools();
    if(menu) win.setMenuBarVisibility(true);
	
    win.setSize(desktop['width'],desktop['height']);
    win.setMaximizable(config['window']['maximizable']);
    

}

let win;
 //创建显示窗口
 //
function createWindow() {
  
  var defaultWindow ={

    maximizable:false,
    width: 1920, height: 1080,
    transparent: false,
	titleBarStyle:"hidden",
    show: false,
    center:true,
    focus:true,
	fullscreen:false,
    useContentSize:true,
    autoHideMenuBar:true,
    frame: false,
    resizable:false,
    webPreferences:{
                
                plugins:true,
                
                allowDisplayingInsecureContent:true
      

    }


  }
   win = new BrowserWindow(defaultWindow);
   win.setMaximizable(false);
   UserInfo.readInfo(mainDir+'config.json',function(err,data){
   config = JSON.parse(data);
   initWebFrame(config);
  })
   win.webContents.once('did-finish-load', function() {
    
    //mainDir+
   UserInfo.readInfo(mainDir+'userdata',function(err,data){
      var url = config['loginUrl']?config['loginUrl']:config['url'];
	  var versionD = config["version"];
      var msg = {
      src:url,
      data:data,
	  version:versionD,
	  width:desktop["width"],
	  height:desktop["height"]
     }
	 win.show();
     win.webContents.send('index_info', JSON.stringify(msg));

     
   })
  
 
  });
   

   win.webContents.on('did-fail-load',function(event,errorCode,errorDescription,validatedURL){

    dialog.showErrorBox(errorDescription,validatedURL)
    app.quit();


   })



   win.on('closed', (event) => {
		win = null;
  });
}


app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') {
	  app.quit();
  }
});


//接受网页端登陆消息

ipc.on('electron_err',(event,args)=>{
  dialog.showErrorBox("网络连接出现问题，请检查网络",args)
  app.quit();


})


app.on('activate', () => {
  
  if (win === null) {
    createWindow();
  }
});



app.on('ready',createMenu);

function createMenu(){
	 desktop = electron.screen.getPrimaryDisplay().workAreaSize;
  if (Menu.getApplicationMenu()) return
  const template = [
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click (item, focusedWindow) {
            if (focusedWindow)   win.webContents.send("reload_content",'dd');
          }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: (() => {
            return (process.platform === 'darwin') ? 'Ctrl+Command+F' : 'F11'
          })(),
          click (item, focusedWindow) {
            if (focusedWindow) focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: (() => {
            return (process.platform === 'darwin') ? 'Alt+Command+I' : 'Ctrl+Shift+I'
          })(),
          click (item, focusedWindow) {
            if (focusedWindow) {
                win.webContents.send('open_devtol','萨达');
                focusedWindow.toggleDevTools();
                console.log('萨达');
            }
          }
        },
        {
          label: 'Toggle Web Tools',
          accelerator: (() => {
            return (process.platform === 'darwin') ? 'Alt+Command+O' : 'Ctrl+Shift+O'
          })(),
          click (item, focusedWindow) {
            if (focusedWindow) {
                win.webContents.send('open_devtol','萨达');
               // focusedWindow.toggleDevTools();
                console.log('萨达');
            }
          }
        }

      ]
    },
    {
      label: 'Window',
      role: 'window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        }
      ]
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click () {
            shell.openExternal('http://electron.atom.io')
          }
        },
        {
          label: 'Documentation',
          click () {
            shell.openExternal(
              `https://github.com/electron/electron/tree/v${process.versions.electron}/docs#readme`
            )
          }
        },
        {
          label: 'Community Discussions',
          click () {
            shell.openExternal('https://discuss.atom.io/c/electron')
          }
        },
        {
          label: 'Search Issues',
          click () {
            shell.openExternal('https://github.com/electron/electron/issues')
          }
        }
      ]
    }
  ]

   const menu = Menu.buildFromTemplate(template)
   Menu.setApplicationMenu(menu)

}
//防止多开
var shouldquite = app.makeSingleInstance(function(args,workingDirectory){
  if(win!=null){

     if (win.isMinimized()) win.restore();
     win.focus();
  }
  return true
})
if(shouldquite){

  app.quit();
  return
}

