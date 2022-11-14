import { ConnectorMetadata } from '@logto/connector-kit';
export declare const authorizationEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
export declare const accessTokenEndpoint = "https://oauth2.googleapis.com/token";
export declare const userInfoEndpoint = "https://openidconnect.googleapis.com/v1/userinfo";
export declare const scope = "openid profile email";
export declare const defaultMetadata: ConnectorMetadata;
export declare const defaultTimeout = 5000;
