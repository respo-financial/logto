import { LanguageKey, languageKeyGuard } from '@logto/core-kit';
import resource from '@logto/phrases-ui';
import { CustomPhrases } from '@logto/schemas';
import { adminConsoleApplicationId, adminConsoleSignInExperience } from '@logto/schemas/lib/seeds';
import deepmerge from 'deepmerge';
import { Provider } from 'oidc-provider';

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

const isBuiltInLanguageKey = (key: string): key is LanguageKey =>
  Object.keys(resource).includes(key) && languageKeyGuard.safeParse(key).success;

const englishBuiltInPhrase = { ...resource.en, languageKey: 'en' };

const getFallbackPhrase = async (fallbackLanguage: string, customLanguages: string[]) => {
  const hasCustomPhrase = customLanguages.includes(fallbackLanguage);
  const hasBuiltInPhrase = isBuiltInLanguageKey(fallbackLanguage);

  const englishPhrase = customLanguages.includes('en')
    ? deepmerge(englishBuiltInPhrase, await findCustomPhraseByLanguageKey('en'))
    : englishBuiltInPhrase;

  // The fallback language is not supported.
  if (!hasCustomPhrase && !hasBuiltInPhrase) {
    return englishPhrase;
  }

  if (!hasCustomPhrase && hasBuiltInPhrase) {
    return { ...resource[fallbackLanguage], languageKey: fallbackLanguage };
  }

  const customPhrase = await findCustomPhraseByLanguageKey(fallbackLanguage);

  if (hasCustomPhrase && hasBuiltInPhrase) {
    return deepmerge(resource[fallbackLanguage], customPhrase);
  }

  return deepmerge(englishPhrase, customPhrase);
};

const getPhrase = async (detectedLanguages: string[], fallbackLanguage: string) => {
  const customLanguages = await findAllCustomLanguageKeys();
  const fallbackPhrase = await getFallbackPhrase(fallbackLanguage, customLanguages);

  const detectedLanguage = detectedLanguages.find(
    (key) => isBuiltInLanguageKey(key) || customLanguages.includes(key)
  );

  // There is no detected language or all detected languages are not supported.
  if (!detectedLanguage) {
    return fallbackPhrase;
  }

  const hasCustomPhrase = customLanguages.includes(detectedLanguage);
  const hasBuiltInPhrase = isBuiltInLanguageKey(detectedLanguage);

  if (!hasCustomPhrase && hasBuiltInPhrase) {
    return { ...resource[detectedLanguage], languageKey: detectedLanguage };
  }

  const customPhrase = await findCustomPhraseByLanguageKey(detectedLanguage);

  if (hasCustomPhrase && hasBuiltInPhrase) {
    return deepmerge(resource[detectedLanguage], customPhrase);
  }

  return deepmerge(fallbackPhrase, customPhrase);
};

export default function phraseRoutes<T extends AnonymousRouter>(router: T, provider: Provider) {
  router.get(
    '/phrase',
    koaGuard({
      response: CustomPhrases.guard,
    }),
    async (ctx, next) => {
      const interaction = await provider
        .interactionDetails(ctx.req, ctx.res)
        .catch((error: unknown) => {
          // Should not block when failed to get interaction
          return null;
        });

      const applicationId = interaction?.params.client_id;
      const { autoDetect, fallbackLanguage } = await getLanguageInfo(applicationId);
      const detectedLanguages = autoDetect ? detectLanguage(ctx) : [];
      ctx.body = await getPhrase(detectedLanguages, fallbackLanguage);

      return next();
    }
  );
}
