import { languageTagGuard } from '@logto/language-kit';
import resource from '@logto/phrases-ui';
import { CustomPhrases, Translation, translationGuard } from '@logto/schemas';
import cleanDeep from 'clean-deep';
import { object } from 'zod';

import RequestError from '@/errors/RequestError';
import koaGuard from '@/middleware/koa-guard';
import {
  deleteCustomPhraseByLanguageTag,
  findAllCustomPhrases,
  findCustomPhraseByLanguageTag,
  upsertCustomPhrase,
} from '@/queries/custom-phrase';
import { findDefaultSignInExperience } from '@/queries/sign-in-experience';
import assertThat from '@/utils/assert-that';
import { isValidStructure } from '@/utils/translation';

import { AuthedRouter } from './types';

const cleanDeepTranslation = (translation: Translation) =>
  // Since `Translation` type actually equals `Partial<Translation>`, force to cast it back to `Translation`.
  // eslint-disable-next-line no-restricted-syntax
  cleanDeep(translation) as Translation;

export default function customPhraseRoutes<T extends AuthedRouter>(router: T) {
  router.get(
    '/custom-phrases',
    koaGuard({
      response: CustomPhrases.guard.array(),
    }),
    async (ctx, next) => {
      ctx.body = await findAllCustomPhrases();

      return next();
    }
  );

  router.get(
    '/custom-phrases/:languageTag',
    koaGuard({
      params: object({ languageTag: languageTagGuard }),
      response: CustomPhrases.guard,
    }),
    async (ctx, next) => {
      const {
        params: { languageTag },
      } = ctx.guard;

      ctx.body = await findCustomPhraseByLanguageTag(languageTag);

      return next();
    }
  );

  router.put(
    '/custom-phrases/:languageTag',
    koaGuard({
      params: object({ languageTag: languageTagGuard }),
      body: translationGuard,
      response: CustomPhrases.guard,
    }),
    async (ctx, next) => {
      const {
        params: { languageTag },
        body,
      } = ctx.guard;

      const translation = cleanDeepTranslation(body);

      assertThat(
        isValidStructure(resource.en.translation, translation),
        new RequestError('localization.invalid_translation_structure')
      );

      ctx.body = await upsertCustomPhrase({ languageTag, translation });

      return next();
    }
  );

  router.delete(
    '/custom-phrases/:languageTag',
    koaGuard({
      params: object({ languageTag: languageTagGuard }),
    }),
    async (ctx, next) => {
      const {
        params: { languageTag },
      } = ctx.guard;

      const {
        languageInfo: { fallbackLanguage },
      } = await findDefaultSignInExperience();

      if (fallbackLanguage === languageTag) {
        throw new RequestError({
          code: 'localization.cannot_delete_default_language',
          languageTag,
        });
      }

      await deleteCustomPhraseByLanguageTag(languageTag);
      ctx.status = 204;

      return next();
    }
  );
}
