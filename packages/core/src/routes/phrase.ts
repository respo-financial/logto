import { CustomPhrases } from '@logto/schemas';
import { adminConsoleApplicationId, adminConsoleSignInExperience } from '@logto/schemas/lib/seeds';
import { Provider } from 'oidc-provider';

import detectLanguage from '@/i18n/detect-language';
import { getPhrase } from '@/lib/phrase';
import koaGuard from '@/middleware/koa-guard';
import { findDefaultSignInExperience } from '@/queries/sign-in-experience';

import { AnonymousRouter } from './types';

const getLanguageInfo = async (applicationId: unknown) => {
  if (applicationId === adminConsoleApplicationId) {
    return adminConsoleSignInExperience.languageInfo;
  }

  const { languageInfo } = await findDefaultSignInExperience();

  return languageInfo;
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
        // Should not block when failed to get interaction
        .catch(() => null);

      const applicationId = interaction?.params.client_id;
      const { autoDetect, fallbackLanguage } = await getLanguageInfo(applicationId);
      const detectedLanguages = autoDetect ? detectLanguage(ctx) : [];
      ctx.body = await getPhrase(detectedLanguages, fallbackLanguage);

      return next();
    }
  );
}
