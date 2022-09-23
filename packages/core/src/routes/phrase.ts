import { LanguageKey } from '@logto/core-kit';
import resource from '@logto/phrases-ui';
import { CustomPhrase, translationGuard } from '@logto/schemas';
import { adminConsoleApplicationId, adminConsoleSignInExperience } from '@logto/schemas/lib/seeds';
import deepmerge from 'deepmerge';
import { ResourceLanguage } from 'i18next';
import { Provider } from 'oidc-provider';
import { z } from 'zod';

import detectLanguage from '@/i18n/detect-language';
import koaGuard from '@/middleware/koa-guard';
import { findAllCustomLanguageKeys, findCustomPhraseByLanguageKey } from '@/queries/custom-phrase';
import { findDefaultSignInExperience } from '@/queries/sign-in-experience';

import { AnonymousRouter } from './types';

const getLanguageInfo = async (applicationId: unknown) => {
  if (applicationId === adminConsoleApplicationId) {
    return adminConsoleSignInExperience.languageInfo;
  }

  const { languageInfo } = await findDefaultSignInExperience();

  return languageInfo;
};

const isBuiltInLanguage = (key: string): key is LanguageKey => Object.keys(resource).includes(key);

const getBuiltInResourceLanguage = (key: LanguageKey): ResourceLanguage => resource[key];

const getResourceLanguage = async (supportedLanguage: string, customLanguages: string[]) => {
  if (!isBuiltInLanguage(supportedLanguage)) {
    return deepmerge<ResourceLanguage, CustomPhrase>(
      resource.en,
      await findCustomPhraseByLanguageKey(supportedLanguage)
    );
  }

  if (!customLanguages.includes(supportedLanguage)) {
    return getBuiltInResourceLanguage(supportedLanguage);
  }

  return deepmerge<ResourceLanguage, CustomPhrase>(
    getBuiltInResourceLanguage(supportedLanguage),
    await findCustomPhraseByLanguageKey(supportedLanguage)
  );
};

export default function phraseRoutes<T extends AnonymousRouter>(router: T, provider: Provider) {
  router.get(
    '/phrase',
    koaGuard({
      response: z.object({ translation: translationGuard }),
    }),
    async (ctx, next) => {
      const interaction = await provider
        .interactionDetails(ctx.req, ctx.res)
        // Should not block when failed to get interaction
        .catch(() => null);

      const applicationId = interaction?.params.client_id;
      const { autoDetect, fallbackLanguage } = await getLanguageInfo(applicationId);

      const detectedLanguages = autoDetect ? detectLanguage(ctx) : [];
      const acceptableLanguages = [...detectedLanguages, fallbackLanguage];
      const customLanguages = await findAllCustomLanguageKeys();
      const language =
        acceptableLanguages.find(
          (key) => isBuiltInLanguage(key) || customLanguages.includes(key)
        ) ?? 'en';

      ctx.set('Content-Language', language);
      ctx.body = await getResourceLanguage(language, customLanguages);

      return next();
    }
  );
}
