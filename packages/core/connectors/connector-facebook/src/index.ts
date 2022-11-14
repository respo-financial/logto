/**
 * Reference: Manually Build a Login Flow
 * https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow
 */

import {
  ConnectorError,
  ConnectorErrorCodes,
  CreateConnector,
  SocialConnector,
  GetAuthorizationUri,
  GetUserInfo,
  GetConnectorConfig,
  validateConfig,
  ConnectorType,
  parseJson,
} from '@logto/connector-kit';
import { assert } from '@silverhand/essentials';
import got, { HTTPError } from 'got';

import {
  accessTokenEndpoint,
  authorizationEndpoint,
  scope,
  userInfoEndpoint,
  defaultMetadata,
  defaultTimeout,
} from './constant';
import {
  authorizationCallbackErrorGuard,
  facebookConfigGuard,
  accessTokenResponseGuard,
  FacebookConfig,
  userInfoResponseGuard,
  authResponseGuard,
} from './types';

const getAuthorizationUri =
  (getConfig: GetConnectorConfig): GetAuthorizationUri =>
  async ({ state, redirectUri }) => {
    const config = await getConfig(defaultMetadata.id);
    validateConfig<FacebookConfig>(config, facebookConfigGuard);

    const queryParameters = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      scope, // Only support fixed scope for v1.
    });

    return `${authorizationEndpoint}?${queryParameters.toString()}`;
  };

export const getAccessToken = async (
  config: FacebookConfig,
  codeObject: { code: string; redirectUri: string }
) => {
  const { code, redirectUri } = codeObject;
  validateConfig<FacebookConfig>(config, facebookConfigGuard);

  const { clientId: client_id, clientSecret: client_secret } = config;

  const httpResponse = await got.get(accessTokenEndpoint, {
    searchParams: {
      code,
      client_id,
      client_secret,
      redirect_uri: redirectUri,
    },
    timeout: defaultTimeout,
  });

  const result = accessTokenResponseGuard.safeParse(parseJson(httpResponse.body));

  if (!result.success) {
    throw new ConnectorError(ConnectorErrorCodes.InvalidResponse, result.error);
  }

  const { access_token: accessToken } = result.data;

  assert(accessToken, new ConnectorError(ConnectorErrorCodes.SocialAuthCodeInvalid));

  return { accessToken };
};

const getUserInfo =
  (getConfig: GetConnectorConfig): GetUserInfo =>
  async (data) => {
    const { code, redirectUri } = await authorizationCallbackHandler(data);
    const config = await getConfig(defaultMetadata.id);
    validateConfig<FacebookConfig>(config, facebookConfigGuard);
    const { accessToken } = await getAccessToken(config, { code, redirectUri });

    try {
      const httpResponse = await got.get(userInfoEndpoint, {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        searchParams: {
          fields: 'id,name,email,picture',
        },
        timeout: defaultTimeout,
      });

      const result = userInfoResponseGuard.safeParse(parseJson(httpResponse.body));

      if (!result.success) {
        throw new ConnectorError(ConnectorErrorCodes.InvalidResponse, result.error);
      }

      const { id, email, name, picture } = result.data;

      return {
        id,
        avatar: picture?.data.url,
        email,
        name,
      };
    } catch (error: unknown) {
      if (error instanceof HTTPError) {
        const { statusCode, body: rawBody } = error.response;

        if (statusCode === 400) {
          throw new ConnectorError(ConnectorErrorCodes.SocialAccessTokenInvalid);
        }

        throw new ConnectorError(ConnectorErrorCodes.General, JSON.stringify(rawBody));
      }

      throw error;
    }
  };

const authorizationCallbackHandler = async (parameterObject: unknown) => {
  const result = authResponseGuard.safeParse(parameterObject);

  if (result.success) {
    return result.data;
  }

  const parsedError = authorizationCallbackErrorGuard.safeParse(parameterObject);

  if (!parsedError.success) {
    throw new ConnectorError(ConnectorErrorCodes.InvalidResponse, JSON.stringify(parameterObject));
  }

  const { error, error_code, error_description, error_reason } = parsedError.data;

  if (error === 'access_denied') {
    throw new ConnectorError(ConnectorErrorCodes.AuthorizationFailed, error_description);
  }

  throw new ConnectorError(ConnectorErrorCodes.General, {
    error,
    error_code,
    errorDescription: error_description,
    error_reason,
  });
};

const createFacebookConnector: CreateConnector<SocialConnector> = async ({ getConfig }) => {
  return {
    metadata: defaultMetadata,
    type: ConnectorType.Social,
    configGuard: facebookConfigGuard,
    getAuthorizationUri: getAuthorizationUri(getConfig),
    getUserInfo: getUserInfo(getConfig),
  };
};

export default createFacebookConnector;
