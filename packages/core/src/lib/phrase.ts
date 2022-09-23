import { LanguageKey } from '@logto/core-kit';
import resource from '@logto/phrases-ui';
import { CustomPhrase } from '@logto/schemas';
import deepmerge from 'deepmerge';
import { ResourceLanguage } from 'i18next';

import { findCustomPhraseByLanguageKey } from '@/queries/custom-phrase';

const getBuiltInResourceLanguage = (key: LanguageKey): ResourceLanguage => resource[key];

export const isBuiltInLanguage = (key: string): key is LanguageKey =>
  Object.keys(resource).includes(key);

export const getResourceLanguage = async (supportedLanguage: string, customLanguages: string[]) => {
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
