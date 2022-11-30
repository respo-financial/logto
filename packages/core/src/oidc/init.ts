/* istanbul ignore file */

import { readFileSync } from 'fs';

import { userClaims } from '@logto/core-kit';
import { CustomClientMetadataKey } from '@logto/schemas';
import Koa from 'koa';
import mount from 'koa-mount';
import { Provider, errors } from 'oidc-provider';
import snakecaseKeys from 'snakecase-keys';

import envSet from '@/env-set';
import postgresAdapter from '@/oidc/adapter';
import { isOriginAllowed, validateCustomClientMetadata } from '@/oidc/utils';
import { findApplicationById } from '@/queries/application';
import { findResourceByIndicator } from '@/queries/resource';
import { findUserById } from '@/queries/user';
import { routes } from '@/routes/consts';
import assertThat from '@/utils/assert-that';
import { addOidcEventListeners } from '@/utils/oidc-provider-event-listener';

import { claimToUserKey, getUserClaims } from './scope';

export default async function initOidc(app: Koa): Promise<Provider> {
  const { issuer, cookieKeys, privateJwks, defaultIdTokenTtl, defaultRefreshTokenTtl } =
    envSet.oidc;
  const logoutSource = readFileSync('static/html/logout.html', 'utf8');

  const cookieConfig = Object.freeze({
    sameSite: 'lax',
    path: '/',
    signed: true,
  } as const);
  const oidc = new Provider(issuer, {
    adapter: postgresAdapter,
    renderError: (_ctx, _out, error) => {
      console.log('OIDC error', error);
      throw error;
    },
    cookies: {
      keys: cookieKeys,
      long: cookieConfig,
      short: cookieConfig,
    },
    jwks: {
      keys: privateJwks,
    },
    conformIdTokenClaims: false,
    features: {
      userinfo: { enabled: true },
      revocation: { enabled: true },
      devInteractions: { enabled: false },
      clientCredentials: { enabled: true },
      rpInitiatedLogout: {
        logoutSource: (ctx, form) => {
          // eslint-disable-next-line no-template-curly-in-string
          ctx.body = logoutSource.replace('${form}', form);
        },
      },
      // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#featuresresourceindicators
      resourceIndicators: {
        enabled: true,
        defaultResource: () => '',
        // Disable the auto use of authorization_code granted resource feature
        useGrantedResource: () => false,
        getResourceServerInfo: async (_, indicator) => {
          const resourceServer = await findResourceByIndicator(indicator);

          if (!resourceServer) {
            throw new errors.InvalidTarget();
          }

          const { accessTokenTtl: accessTokenTTL } = resourceServer;

          return {
            accessTokenFormat: 'jwt',
            scope: '',
            // AccessTokenTTL,
            accessTokenTTL: 172_800,
          };
        },
      },
    },
    interactions: {
      url: (_, interaction) => {
        switch (interaction.prompt.name) {
          case 'login':
            return routes.signIn.credentials;
          case 'consent':
            return routes.signIn.consent;
          default:
            throw new Error(`Prompt not supported: ${interaction.prompt.name}`);
        }
      },
    },
    extraClientMetadata: {
      properties: Object.values(CustomClientMetadataKey),
      validator: (_, key, value) => {
        validateCustomClientMetadata(key, value);
      },
    },
    // https://github.com/panva/node-oidc-provider/blob/main/recipes/client_based_origins.md
    clientBasedCORS: (ctx, origin, client) =>
      ctx.request.origin === origin ||
      isOriginAllowed(origin, client.metadata(), client.redirectUris),
    // https://github.com/panva/node-oidc-provider/blob/main/recipes/claim_configuration.md
    // Note node-provider will append `claims` here to the default claims instead of overriding
    claims: userClaims,
    // https://github.com/panva/node-oidc-provider/tree/main/docs#findaccount
    findAccount: async (_ctx, sub) => {
      const user = await findUserById(sub);

      return {
        accountId: sub,
        claims: async (use, scope, claims, rejected) => {
          return snakecaseKeys(
            {
              /**
               * This line is required because:
               * 1. TypeScript will complain since `Object.fromEntries()` has a fixed key type `string`
               * 2. Scope `openid` is removed from `UserScope` enum
               */
              sub,
              ...Object.fromEntries(
                getUserClaims(use, scope, claims, rejected).map((claim) => [
                  claim,
                  user[claimToUserKey[claim]],
                ])
              ),
            },
            {
              deep: false,
            }
          );
        },
      };
    },
    ttl: {
      /**
       * [OIDC Provider Default Settings](https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#ttl)
       */
      IdToken: (_ctx, _token, client) => {
        const { idTokenTtl } = client.metadata();

        return idTokenTtl ?? defaultIdTokenTtl;
      },
      RefreshToken: (_ctx, _token, client) => {
        const { refreshTokenTtl } = client.metadata();

        return refreshTokenTtl ?? defaultRefreshTokenTtl;
      },
      AccessToken: (ctx, token) => {
        if (token.resourceServer) {
          // Return token.resourceServer.accessTokenTTL ?? 60 * 60; // 1 hour in seconds
          return token.resourceServer.accessTokenTTL ?? 172_800; // 2 days in seconds
        }

        // Return 60 * 60; // 1 hour in seconds
        return 172_800; // 2 days in hours
      },
      // Interaction: 3600 /* 1 hour in seconds */,
      Interaction: 172_800 /* 2 days in hours */,
      Session: 1_209_600 /* 14 days in seconds */,
      Grant: 1_209_600 /* 14 days in seconds */,
    },
    extraTokenClaims: async (_ctx, token) => {
      if (token.kind === 'AccessToken') {
        const { accountId } = token;
        const { roleNames } = await findUserById(accountId);

        return snakecaseKeys({
          roleNames,
        });
      }

      // `token.kind === 'ClientCredentials'`
      const { clientId } = token;
      assertThat(clientId, 'oidc.invalid_grant');
      const { roleNames } = await findApplicationById(clientId);

      return snakecaseKeys({ roleNames });
    },
  });

  addOidcEventListeners(oidc);

  app.use(mount('/oidc', oidc.app));

  return oidc;
}
