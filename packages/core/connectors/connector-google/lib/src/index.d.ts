/**
 * The Implementation of OpenID Connect of Google Identity Platform.
 * https://developers.google.com/identity/protocols/oauth2/openid-connect
 */
import { CreateConnector, SocialConnector } from '@logto/connector-kit';
import { GoogleConfig } from './types';
export declare const getAccessToken: (config: GoogleConfig, codeObject: {
    code: string;
    redirectUri: string;
}) => Promise<{
    accessToken: string;
}>;
declare const createGoogleConnector: CreateConnector<SocialConnector>;
export default createGoogleConnector;
