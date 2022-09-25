import { LanguageKey } from '@logto/core-kit';
import resource from '@logto/phrases-ui';
import { Phrase } from '@logto/phrases-ui/lib/types';
import { CustomPhrase } from '@logto/schemas';
import deepmerge from 'deepmerge';

import { findCustomPhraseByLanguageKey } from '@/queries/custom-phrase';

export const isBuiltInLanguage = (key: string): key is LanguageKey =>
  Object.keys(resource).includes(key);

export const getPhrase = async (supportedLanguage: string, customLanguages: string[]) => {
  if (!isBuiltInLanguage(supportedLanguage)) {
    return deepmerge<Phrase, CustomPhrase>(
      resource.en,
      await findCustomPhraseByLanguageKey(supportedLanguage)
    );
  }

  if (!customLanguages.includes(supportedLanguage)) {
    return resource[supportedLanguage];
  }

  return deepmerge<Phrase, CustomPhrase>(
    resource[supportedLanguage],
    await findCustomPhraseByLanguageKey(supportedLanguage)
  );
};
