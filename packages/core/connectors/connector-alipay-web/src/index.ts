/**
 * The Implementation of OpenID Connect of Alipay Web Open Platform.
 * https://opendocs.alipay.com/support/01rg6h
 * https://opendocs.alipay.com/open/263/105808
 * https://opendocs.alipay.com/open/01emu5
 */

import {
  ConnectorError,
  ConnectorErrorCodes,
  GetConnectorConfig,
  GetAuthorizationUri,
  GetUserInfo,
  CreateConnector,
  SocialConnector,
  validateConfig,
  ConnectorType,
  parseJson,
} from '@logto/connector-kit';
import { assert } from '@silverhand/essentials';
import dayjs from 'dayjs';
import got from 'got';
import { z } from 'zod';

import {
  alipayEndpoint,
  authorizationEndpoint,
  methodForAccessToken,
  methodForUserInfo,
  scope,
  defaultMetadata,
  defaultTimeout,
  timestampFormat,
  invalidAccessTokenCode,
  invalidAccessTokenSubCode,
} from './constant';
import {
  alipayConfigGuard,
  AlipayConfig,
  accessTokenResponseGuard,
  userInfoResponseGuard,
  ErrorHandler,
} from './types';
import { signingParameters } from './utils';

export type { AlipayConfig } from './types';

const getAuthorizationUri =
  (getConfig: GetConnectorConfig): GetAuthorizationUri =>
  async ({ state, redirectUri }) => {
    const config = await getConfig(defaultMetadata.id);
    validateConfig<AlipayConfig>(config, alipayConfigGuard);

    const { appId: app_id } = config;

    const redirect_uri = encodeURI(redirectUri);

    const queryParameters = new URLSearchParams({
      app_id,
      redirect_uri, // The variable `redirectUri` should match {appId, appSecret}
      scope,
      state,
    });

    return `${authorizationEndpoint}?${queryParameters.toString()}`;
  };

export const getAccessToken = async (code: string, config: AlipayConfig) => {
  const initSearchParameters = {
    method: methodForAccessToken,
    format: 'JSON',
    timestamp: dayjs().format(timestampFormat),
    version: '1.0',
    grant_type: 'authorization_code',
    code,
    ...config,
  };
  const signedSearchParameters = signingParameters(initSearchParameters);

  const httpResponse = await got.post(alipayEndpoint, {
    searchParams: signedSearchParameters,
    timeout: defaultTimeout,
  });

  const result = accessTokenResponseGuard.safeParse(parseJson(httpResponse.body));

  if (!result.success) {
    throw new ConnectorError(ConnectorErrorCodes.InvalidResponse, result.error);
  }

  const { error_response, alipay_system_oauth_token_response } = result.data;

  const { msg, sub_msg } = error_response ?? {};

  assert(
    alipay_system_oauth_token_response,
    new ConnectorError(ConnectorErrorCodes.SocialAuthCodeInvalid, msg ?? sub_msg)
  );
  const { access_token: accessToken } = alipay_system_oauth_token_response;
  assert(accessToken, new ConnectorError(ConnectorErrorCodes.SocialAuthCodeInvalid));

  return { accessToken };
};

const getUserInfo =
  (getConfig: GetConnectorConfig): GetUserInfo =>
  async (data) => {
    const { auth_code } = await authorizationCallbackHandler(data);
    const config = await getConfig(defaultMetadata.id);
    validateConfig<AlipayConfig>(config, alipayConfigGuard);

    const { accessToken } = await getAccessToken(auth_code, config);

    assert(
      accessToken && config,
      new ConnectorError(ConnectorErrorCodes.InsufficientRequestParameters)
    );

    const initSearchParameters = {
      method: methodForUserInfo,
      format: 'JSON',
      timestamp: dayjs().format(timestampFormat),
      version: '1.0',
      grant_type: 'authorization_code',
      auth_token: accessToken,
      biz_content: JSON.stringify({}),
      ...config,
    };
    const signedSearchParameters = signingParameters(initSearchParameters);

    const httpResponse = await got.post(alipayEndpoint, {
      searchParams: signedSearchParameters,
      timeout: defaultTimeout,
    });

    const { body: rawBody } = httpResponse;

    const result = userInfoResponseGuard.safeParse(parseJson(rawBody));

    if (!result.success) {
      throw new ConnectorError(ConnectorErrorCodes.InvalidResponse, result.error);
    }

    const { alipay_user_info_share_response } = result.data;

    errorHandler(alipay_user_info_share_response);

    const { user_id: id, avatar, nick_name: name } = alipay_user_info_share_response;

    if (!id) {
      throw new ConnectorError(ConnectorErrorCodes.InvalidResponse);
    }

    return { id, avatar, name };
  };

const errorHandler: ErrorHandler = ({ code, msg, sub_code, sub_msg }) => {
  if (invalidAccessTokenCode.includes(code)) {
    throw new ConnectorError(ConnectorErrorCodes.SocialAccessTokenInvalid, msg);
  }

  if (sub_code) {
    assert(
      !invalidAccessTokenSubCode.includes(sub_code),
      new ConnectorError(ConnectorErrorCodes.SocialAuthCodeInvalid, msg)
    );

    throw new ConnectorError(ConnectorErrorCodes.General, {
      errorDescription: msg,
      code,
      sub_code,
      sub_msg,
    });
  }
};

const authorizationCallbackHandler = async (parameterObject: unknown) => {
  const dataGuard = z.object({ auth_code: z.string() });

  const result = dataGuard.safeParse(parameterObject);

  if (!result.success) {
    throw new ConnectorError(ConnectorErrorCodes.InvalidResponse, JSON.stringify(parameterObject));
  }

  return result.data;
};

const createAlipayConnector: CreateConnector<SocialConnector> = async ({ getConfig }) => {
  return {
    metadata: defaultMetadata,
    type: ConnectorType.Social,
    configGuard: alipayConfigGuard,
    getAuthorizationUri: getAuthorizationUri(getConfig),
    getUserInfo: getUserInfo(getConfig),
  };
};

export default createAlipayConnector;
