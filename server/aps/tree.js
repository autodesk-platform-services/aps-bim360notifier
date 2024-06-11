/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

'use strict'; // http://www.w3schools.com/js/js_strict.asp

// token handling in session
var Credentials = require('../credentials');
// forge config information, such as client ID and secret
var config = require('../config');

// entity type encoder
var Encoder = require('node-html-encoder').Encoder;
var encoder = new Encoder('entity');

// web framework
var express = require('express');
var router = express.Router();
// forge oAuth package
var forgeSDK = require('forge-apis');
const { authRefreshMiddleware, getDAHubs, getDAProjects, getProjectFolders,getDAFolderContents, getItemVersions } = require('./service.js');

router.use('/api', authRefreshMiddleware);

router.get('/api/aps/tree', function (req, res) {
  var token = req.session;
 

  var href = decodeURIComponent(req.query.id);
  if (href === '') {
    res.status(500).end();
    return;
  }
  if (href === '#') {
    getHubs(token, res);
  }
  else {
    var params = href.split('/');
    var resourceName = params[params.length - 2];
    var resourceId = params[params.length - 1];
    switch (resourceName) {
      case 'hubs':
        getProjects(resourceId, token, res);
        break;
      case 'projects':
        // for a project, first we need the top/root folder
        var hubId = params[params.length - 3];
        getFolders(hubId, resourceId/*project_id*/, token, res)
        break;
      case 'folders':
       var projectId = params[params.length - 3];
       getFolderContents(projectId, resourceId/*folder_id*/, token, res);
       break;
      case 'items':
       var projectId = params[params.length - 3];
       getVersions(projectId, resourceId/*item_id*/, token, res);
       break;
    }
  }
});

async function getHubs(token, res) {
  await getDAHubs(token)
    .then(function (data) {

      if (process.env.CONSOLELOG)
        if (data.meta.warnings)
          for (var key in data.meta.warnings) {
            var warning = data.meta.warnings[key];
            console.log(warning.HttpStatusCode + "/" + warning.ErrorCode + ":" + warning.Detail + ' > ' + warning.Title)
          }


      var hubsForTree = [];
      // data.body.data.forEach(function (hub) {
        data.forEach(function (hub) {
        var hubType;

        switch (hub.attributes.extension.type) {
          case "hubs:autodesk.core:Hub":
            hubType = "hubs";
            break;
          case "hubs:autodesk.a360:PersonalHub":
            hubType = "personalHub";
            break;
          case "hubs:autodesk.bim360:Account":
            hubType = "bim360Hubs";
            break;
        }

        hubsForTree.push(prepareItemForTree(
          hub.links.self.href,
          hub.attributes.name,
          hubType,
          true
        ));
      });
      res.json(hubsForTree);
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).end();
    });
}

async function getProjects(hubId, token, res) {
 
  await getDAProjects(hubId, token)
    .then(function (projects) {
      var projectsForTree = [];
      projects.forEach(function (project) {
        var projectType = 'projects';
        switch (project.attributes.extension.type) {
          case 'projects:autodesk.core:Project':
            projectType = 'a360projects';
            break;
          case 'projects:autodesk.bim360:Project':
            projectType = 'bim360projects';
            break;
        }

        projectsForTree.push(prepareItemForTree(
          project.links.self.href,
          project.attributes.name,
          projectType,
          true
        ));
      });
      res.json(projectsForTree);
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).end();
    });
}

async function getFolders(hubId, projectId, token, res) {
  
  await getProjectFolders(hubId,projectId, token)
    .then(function (topFolders) {
      var folderItemsForTree = [];
      topFolders.forEach(function (item) {
        folderItemsForTree.push(prepareItemForTree(
          item.links.self.href,
          item.attributes.displayName == null ? item.attributes.name : item.attributes.displayName,
          item.type,
          true // Changed here for this sample
        ))
     
      });
      res.json(folderItemsForTree);
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).end();
    });
}

var unsupported = [
  'bot@autodesk360.com'
];

async function getFolderContents(projectId, folderId, token, res) {
  // var folders = new forgeSDK.FoldersApi();
  await getDAFolderContents(token, projectId, folderId, {} )
    .then(function (folderContents) {
      var folderItemsForTree = [];
      folderContents.forEach(function (item) {

        var displayName = item.attributes.displayName == null ? item.attributes.name : item.attributes.displayName;
        var itemType = (unsupported.indexOf(item.attributes.createUserName) == -1 ? item.type : 'unsupported');
        if (displayName !== '') { // BIM 360 Items with no displayName also don't have storage, so not file to transfer
          folderItemsForTree.push(prepareItemForTree(
            item.links.self.href,
            displayName,
            itemType,
            (itemType !== 'unsupported')
          ));
        }
      });
      res.json(folderItemsForTree);
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).end();
    });
}

async function getVersions(projectId, itemId,token, res) {
  var items = new forgeSDK.ItemsApi();
  // items.getItemVersions(projectId, itemId, {}, oauthClient, credentials)
  await getItemVersions(token, projectId,itemId)
    .then(function (versions) {
      var versionsForTree = [];
      var moment = require('moment');
      versions.forEach(function (version) {
        var lastModifiedTime = moment(version.attributes.lastModifiedTime);
        var days = moment().diff(lastModifiedTime, 'days')
        var dateFormated = (versions.length > 1 || days > 7 ? lastModifiedTime.format('MMM D, YYYY, h:mm a') : lastModifiedTime.fromNow());
        var versionst = version.id.match(/^(.*)\?version=(\d+)$/) [2];
        versionsForTree.push(prepareItemForTree(
          version.links.self.href,
          decodeURI('v' + versionst + ': ' + dateFormated + ' by ' + version.attributes.lastModifiedUserName),
          (unsupported.indexOf(version.attributes.createUserName) == -1 ? 'versions' : 'unsupported'),
          false
        ));
      });
      res.json(versionsForTree);
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).end();
    })
}

function prepareItemForTree(_id, _text, _type, _children) {
  return {id: _id, text: encoder.htmlEncode(_text), type: _type, children: _children};
}

module.exports = router;