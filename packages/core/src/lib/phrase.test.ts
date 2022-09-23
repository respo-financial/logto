import resource from '@logto/phrases-ui';
import { CustomPhrase } from '@logto/schemas';
import deepmerge from 'deepmerge';

import {
  enKey,
  mockEnCustomPhrase,
  mockZhCnCustomPhrase,
  mockZhHkCustomPhrase,
  trTrKey,
  zhCnKey,
  zhHkKey,
} from '@/__mocks__/custom-phrase';
import RequestError from '@/errors/RequestError';
import { getResourceLanguage } from '@/lib/phrase';

const englishBuiltInPhrase = resource[enKey];

const customOnlyLanguage = zhHkKey;
const customOnlyCustomPhrase = mockZhHkCustomPhrase;

const customizedLanguage = zhCnKey;
const customizedBuiltInPhrase = resource[zhCnKey];
const customizedCustomPhrase = mockZhCnCustomPhrase;

const mockCustomPhrases: Record<string, CustomPhrase> = {
  [enKey]: mockEnCustomPhrase,
  [customOnlyLanguage]: customOnlyCustomPhrase,
  [customizedLanguage]: customizedCustomPhrase,
};

const findCustomPhraseByLanguageKey = jest.fn(async (languageKey: string) => {
  const mockCustomPhrase = mockCustomPhrases[languageKey];

  if (!mockCustomPhrase) {
    throw new RequestError({ code: 'entity.not_found', status: 404 });
  }

  return mockCustomPhrase;
});

jest.mock('@/queries/custom-phrase', () => ({
  findCustomPhraseByLanguageKey: async (key: string) => findCustomPhraseByLanguageKey(key),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('when the language is English', () => {
  it('should be English custom phrase merged with its built-in phrase when its custom phrase exists', async () => {
    await expect(getResourceLanguage(enKey, [enKey])).resolves.toEqual(
      deepmerge(englishBuiltInPhrase, mockEnCustomPhrase)
    );
  });

  it('should be English built-in phrase when its custom phrase does not exist', async () => {
    await expect(getResourceLanguage(enKey, [])).resolves.toEqual(englishBuiltInPhrase);
  });
});

describe('when the language is not English', () => {
  it('should be custom phrase merged with built-in phrase when both of them exist', async () => {
    await expect(getResourceLanguage(customizedLanguage, [customizedLanguage])).resolves.toEqual(
      deepmerge(customizedBuiltInPhrase, customizedCustomPhrase)
    );
  });

  it('should be built-in phrase when there is built-in phrase and no custom phrase', async () => {
    const builtInOnlyLanguage = trTrKey;
    const builtInOnlyPhrase = resource[trTrKey];
    await expect(getResourceLanguage(builtInOnlyLanguage, [])).resolves.toEqual(builtInOnlyPhrase);
  });

  it('should be built-in phrase when there is custom phrase and no built-in phrase', async () => {
    await expect(getResourceLanguage(customOnlyLanguage, [customOnlyLanguage])).resolves.toEqual(
      deepmerge(englishBuiltInPhrase, customOnlyCustomPhrase)
    );
  });
});
