import { LanguageKey } from '@logto/core-kit';
import resource from '@logto/phrases-ui';
import { ResourceLanguage } from '@logto/phrases-ui/lib/types';
import deepmerge from 'deepmerge';

import { findAllCustomLanguageKeys, findCustomPhraseByLanguageKey } from '@/queries/custom-phrase';

const isBuiltInLanguage = (key: string): key is LanguageKey => Object.keys(resource).includes(key);

const getCustomPhrase = async (key: string | undefined, customLanguages: string[]) =>
  key && customLanguages.includes(key) ? findCustomPhraseByLanguageKey(key) : {};

const getBuiltInPhrase = (key: string | undefined) =>
  key && isBuiltInLanguage(key) ? { ...resource[key], languageKey: key } : {};

const has = (object: Record<string, unknown>) => Object.keys(object).length > 0;

export const getPhrase = async (detectedLanguages: string[], fallbackLanguage: string) => {
  const customLanguages = await findAllCustomLanguageKeys();
  const language = detectedLanguages.find(
    (key) => isBuiltInLanguage(key) || customLanguages.includes(key)
  );

  const detectedCustomPhrase = await getCustomPhrase(language, customLanguages);
  const detectedBuiltInPhrase = getBuiltInPhrase(language);

  if (has(detectedBuiltInPhrase)) {
    return deepmerge(detectedBuiltInPhrase, detectedCustomPhrase);
  }

  const fallbackCustomPhrase = await getCustomPhrase(fallbackLanguage, customLanguages);
  const fallbackBuiltInPhrase = getBuiltInPhrase(fallbackLanguage);

  if (has(fallbackBuiltInPhrase)) {
    const fallbackPhrase: ResourceLanguage = deepmerge(fallbackBuiltInPhrase, fallbackCustomPhrase);

    return deepmerge(fallbackPhrase, detectedCustomPhrase);
  }

  const englishPhrase: ResourceLanguage = deepmerge(
    getBuiltInPhrase('en'),
    await getCustomPhrase('en', customLanguages)
  );

  return deepmerge(englishPhrase, deepmerge(fallbackCustomPhrase, detectedCustomPhrase));
};
