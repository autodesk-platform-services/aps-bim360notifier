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
var Credentials = require('./../credentials');
// forge config information, such as client ID and secret
var config = require('./../config');

// web framework
var express = require('express');
var router = express.Router();
// forge oAuth package
var forgeSDK = require('forge-apis');
//New Autodesk SDK in Beta

const { getAuthorizationUrl, authCallbackMiddleware, authRefreshMiddleware, getUserProfile,getLogoutUrl } = require('./service.js');


router.get('/api/aps/signin', function (req, res) {

  const url = getAuthorizationUrl();
  res.end(url)
});



// OAuth callback from Autodesk Forge


router.get('/api/aps/callback/oauth', authCallbackMiddleware, function (req, res, next) {
  try {
  console.log("oauth complete; redirecting to homepage");
  res.redirect('/');
} catch (err) {
  next(err);
}

});


router.get('/api/auth/token', authRefreshMiddleware, function (req, res) {
  res.json(req.publicOAuthToken);
});

router.get('/api/aps/profile', authRefreshMiddleware, async function (req, res, next) {
  try {
      const profile = await getUserProfile(req.internalOAuthToken);
     
      res.json({ name: `${profile.name} `,picture: `${profile.picture}`, id: `${profile.eidm_guid}`
     });
  } catch (err) {
      next(err);
  }
});

router.get('/logout', function (req, res) {
  const url = getLogoutUrl();
  req.session = null;
  res.redirect(url);
});

module.exports = router;