const crypto = require('crypto');
const { AuthenticationClient, ResponseType, Scopes, TokenTypeHint  } = require('@aps_sdk/authentication');

const { ApiResponse, SDKManager, SdkManagerBuilder  } = require ('@aps_sdk/autodesk-sdkmanager');
const { DataManagementClient } = require('@aps_sdk/data-management');


const axios = require('axios').default;
// web framework
var express = require('express');
var router = express.Router();

// const { client_id, client_secret, callback_url, scopes, PUBLIC_TOKEN_SCOPES } = require('../config.js');
var config = require('./../config');
var Credentials = require('./../credentials');


const sdkmanager = SdkManagerBuilder.Create().build();
const authenticationClient = new AuthenticationClient(sdkmanager);
const dataManagementClient = new DataManagementClient(sdkmanager);


const service = module.exports = {};


service.getAuthorizationUrl = () => authenticationClient.authorize(config.aps.credentials.client_id, ResponseType.Code, config.aps.callbackURL, config.aps.scope)



service.getLogoutUrl = () => authenticationClient.Logout("/");


service.authCallbackMiddleware = async (req, res, next) => {
    var token = new Credentials(req.session);

    
    const internalCredentials = await authenticationClient.getThreeLeggedTokenAsync(config.aps.credentials.client_id,config.aps.credentials.client_secret,req.query.code, config.aps.callbackURL);

     const publicCredentials = internalCredentials;
    req.session.access_token = internalCredentials.access_token;
    token.setApsCredentials(internalCredentials)
    req.session.public_token = publicCredentials.access_token;
    req.session.refresh_token = publicCredentials.refresh_token;
    req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
    const userInfo = await authenticationClient.getUserinfoAsync(req.session.access_token);
    token.setAutodeskId(userInfo.eidm_guid)
    req.session.user_name = userInfo.name
    req.session.user_email =  userInfo.email;

    next();

};

service.authRefreshMiddleware = async (req, res, next) => {
    var token = new Credentials(req.session);

    let { refresh_token, expires_at } = req.session;
    if (!refresh_token) {
        res.status(401).end();
        return;
    }
    if (expires_at < Date.now()) {

        const internalCredentials = await authenticationClient.getRefreshTokenAsync(config.aps.credentials.client_id, config.aps.credentials.client_secret, refresh_token,config.aps.scope);

        const publicCredentials = internalCredentials

        req.session.public_token = publicCredentials.access_token;
        req.session.access_token = internalCredentials.access_token;
        token.setApsCredentials(internalCredentials);

        req.session.refresh_token = publicCredentials.refresh_token;
        req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
    const userInfo = await authenticationClient.getUserinfoAsync(req.session.access_token);
    token.setAutodeskId(userInfo.eidm_guid)


    }
    req.internalOAuthToken = {
        access_token: req.session.access_token,
        expires_in: Math.round((req.session.expires_at - Date.now()) / 1000)
    };
    req.publicOAuthToken = {
        access_token: req.session.public_token,
        expires_in: Math.round((req.session.expires_at - Date.now()) / 1000)
    };
    next();
};

service.getUserProfile = async (req, res ) => {
    var token = new Credentials(req.session);
   

    const userInfo = await authenticationClient.getUserinfoAsync(req.access_token);

    return userInfo;
};

//Get 2-LO token
service.getTwoLeggedToken = async (req, res) => {
  
    var scope= ['data:read'];
    var credentials = await authenticationClient.getTwoLeggedTokenAsync(config.aps.credentials.client_id, config.aps.credentials.client_secret,scope)
    // console.log("2 legged token", credentials)
    return credentials;
}

// Data Management APIs
service.getDAHubs = async (token) => {
    const resp = await dataManagementClient.getHubs(token.access_token);
    console.log("hubs", resp.data)
    return resp.data;
    // return resp.data.filter((item)=>{
    //     return item.id.startsWith('b.');
    // })
};

service.getDAProjects = async (hubId, token) => {
    const resp = await dataManagementClient.getHubProjects(token.access_token, hubId);
    return resp.data;
    // return resp.data.filter( (item)=>{
    //     return item.attributes.extension.data.projectType == 'BIM360';
    // } )
};

service.getProjectFolders = async(hubId, projectId, token) => {
    const resp = await dataManagementClient.getProjectTopFolders(token.access_token, hubId, projectId);
    return resp.data;
}
service.getDAFolderContents= async(token, projectId,folderId) => {
    const resp = await dataManagementClient.getFolderContents(token.access_token, projectId,folderId,{})
    return resp.data;
}
service.getItemVersions = async (token, projectId, itemId) => {
const resp = await dataManagementClient.getItemVersions(token.access_token, projectId, itemId);
return resp.data;
}





