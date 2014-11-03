'use strict';

var CastAppManager = (function () {

  var receiverAppUrl = 'about:blank';

  var castAppConfig = {
    'isActivity': false,
    'url': 'app://castappcontainer.gaiamobile.org/index.html',
    'name': 'CastAppContainer',
    'manifestURL': 'app://castappcontainer.gaiamobile.org/manifest.webapp',
    'origin': 'app://castappcontainer.gaiamobile.org'
  };

  var localAppConfig = {
    'url': '',
    'manifestURL': '',
    'origin': ''
  };
  var appWindowFactory = new AppWindowFactory();

  function doAppCommand(message) {
    console.log('pal:', 'message = ' + JSON.stringify(message));
    var command = message.type;
    if (command == 'LAUNCH_RECEIVER') {
      if (message.app_id == '~browser') {
        if (!message.app_info) {
          return;
        }
        var httpStr = message.app_info.url;
        if (httpStr.indexOf('http') == 0) {
          startCastAppContainer(httpStr);
        }
      } else if (message.app_id == '~native') {
        if (!message.app_info) {
          return;
        }
        var appStr = message.app_info.url;
        if (appStr.index('app:?') == 0) {
          startNativeApp(appStr.slice(5));
        } else {
          console.error('can not start native application: ' + appStr);
        }
      } else if (message.appUrl) {
        startCastAppContainer(message.appUrl);
      }
    } else if (command == 'STOP_RECEIVER') {
      if (message.app_id == '~browser') {
        stopApplication(castAppConfig);
      } else if (message.app_id == '~native') {
        if (message.app_info && message.app_info.url) {
          var nativeStr = message.app_info.url;
          if (nativeStr.index('app:?') == 0) {
            var appPkg = nativeStr.slice(5);
            var prefix = 'app://';
            console.log('native app package name: ' + appPkg);
            localAppConfig.url = prefix + appPkg + '/index.html';
            localAppConfig.manifestURL = prefix + appPkg + '/manifest.webapp';
            localAppConfig.origin = prefix + appPkg;
            stopApplication(localAppConfig);
          } else {
            console.error('can not stop native application: ' + nativeStr);
          }
        }
      }
      else {
        stopApplication(castAppConfig);
      }
    } else {
      console.error('not support command: ' + command);
    }
  }

  function stopApplication(config) {
    console.log('pal:', 'Stop app:', config.origin);
    AppWindowManager.display(null, 'immediate', 'immediate');
    AppWindowManager.kill(config.origin);
    //TODO
//    appWindowFactory.handleEvent({
//      type: 'webapps-close',
//      detail: config
//    });
  }

  function startNativeApp(pkg) {
    console.log('pal:', 'Start native app, package name = ' + pkg);
    var prefix = 'app://';
    localAppConfig.url = prefix + pkg + '/index.html';
    localAppConfig.manifestURL = prefix + pkg + '/manifest.webapp';
    localAppConfig.origin = prefix + pkg;
    appWindowFactory.handleEvent({
      type: 'webapps-launch',
      detail: localAppConfig
    });
  }

  function startCastAppContainer(appUrl) {
    console.log('pal:', 'Start receiver app, url = ' + appUrl);
    receiverAppUrl = appUrl;
    navigator.mozApps.mgmt.getAll().onsuccess = function (event) {
      var apps;
      apps = event.target.result;
      apps.forEach(function (app) {
        if (app.manifest.name === 'CastAppContainer') {
          app.launch();
        }
      });
    };
  }

  window.addEventListener('iac-receiver-app-request', function (evt) {
      console.log('pal:', 'Handle the request from receiver app container!');
      try {
          var port = IACHandler.getPort('receiver-app-request');
      } catch (error) {
          console.log(error.toString());
      }
      var req = evt.detail;
      if (req == 'req-url') {
          console.log('pal:', 'Response receiver app url:', receiverAppUrl);
          port.postMessage(['url', receiverAppUrl]);
          receiverAppUrl = 'about:blank';
      }
  });

  return {
    doAppCommand: doAppCommand
  }

})
();