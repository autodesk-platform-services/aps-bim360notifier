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
require('dotenv').config();

module.exports = {
  // Autodesk Forge configuration
  aps: {
    // Required scopes for your application on server-side
    scope: ['data:read', 'data:write', 'data:create', 'data:search'],

    // this this callback URL when creating your client ID and secret
    callbackURL: process.env.APS_CALLBACK_URL || null,
    // credentials
    credentials: {
      client_id: process.env.APS_CLIENT_ID || null,
      client_secret: process.env.APS_CLIENT_SECRET || null
    },

    hookCallbackHost : process.env.APS_WEBHOOK_URL || null,
    SERVER_SESSION_SECRET: process.env.SERVER_SESSION_SECRET || null
  },

  twilio: {
    credentials : {
      accountSid:  process.env.TWILIO_ACCOUNT_SID,
      token:  process.env.TWILIO_TOKEN
    },
    fromNumber:  process.env.TWILIO_FROM_NUMER
  },

  postmark: {
    credentials: {
      accountId: process.env.POSTMARK_ACCOUNT_ID
    },
    fromEmail: process.env.POSTMARK_FROM_EMAIL
  }
};