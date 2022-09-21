import fr from '@logto/phrases-ui/lib/locales/fr';
import zhCN from '@logto/phrases-ui/lib/locales/zh-cn';
import { CustomPhrase } from '@logto/schemas';
import deepmerge from 'deepmerge';

import {
  enKey,
  frKey,
  koKrKey,
  mockEnCustomPhrase,
  mockEnPhrase,
  mockTrTrCustomPhrase,
  mockZhCnCustomPhrase,
  mockZhHkCustomPhrase,
  mockZhTwCustomPhrase,
  trTrKey,
  zhCnKey,
  zhHkKey,
  zhTwKey,
} from '@/__mocks__/custom-phrase';
import RequestError from '@/errors/RequestError';
import { getPhrase } from '@/lib/phrase';

const builtInOnlyLanguage = frKey;
const builtInOnlyPhrase = { ...fr, languageKey: builtInOnlyLanguage };

const customOnlyLanguage = zhHkKey;
const customOnlyPhrase = mockZhHkCustomPhrase;

const customOnlyFallbackLanguage = zhTwKey;
const customOnlyFallbackPhrase = mockZhTwCustomPhrase;

const mixedLanguage = zhCnKey;
const mixedPhrase = deepmerge(zhCN, mockZhCnCustomPhrase);

const unsupportedLanguage = 'xx-XX';
const unsupportedFallbackLanguage = 'yy-YY';

const mockFallbackLanguage = trTrKey;

const mockCustomPhrases: Record<string, CustomPhrase> = {
  [enKey]: mockEnCustomPhrase,
  [trTrKey]: mockTrTrCustomPhrase,
  [zhCnKey]: mockZhCnCustomPhrase,
  [zhHkKey]: mockZhHkCustomPhrase,
  [zhTwKey]: mockZhTwCustomPhrase,
};

const findAllCustomLanguageKeys = jest.fn(async () => Object.keys(mockCustomPhrases));

const findCustomPhraseByLanguageKey = jest.fn(async (languageKey: string) => {
  const mockCustomPhrase = mockCustomPhrases[languageKey];

  if (!mockCustomPhrase) {
    throw new RequestError({ code: 'entity.not_found', status: 404 });
  }

  return mockCustomPhrase;
});

jest.mock('@/queries/custom-phrase', () => ({
  findAllCustomLanguageKeys: async () => findAllCustomLanguageKeys(),
  findCustomPhraseByLanguageKey: async (key: string) => findCustomPhraseByLanguageKey(key),
}));

afterEach(() => {
  jest.clearAllMocks();
});

it('should return `en` language when neither fallback nor detected languages are supported', async () => {
  await expect(getPhrase(['xx-XX', 'yy-YY'], 'zz-ZZ')).resolves.toHaveProperty(
    'languageKey',
    enKey
  );
});

describe('when fallback language is supported', () => {
  it('should return first supported detected language', async () => {
    const detectedLanguages = ['xx-XX', mixedLanguage, koKrKey];
    await expect(getPhrase(detectedLanguages, mockFallbackLanguage)).resolves.toHaveProperty(
      'languageKey',
      mixedLanguage
    );
  });

  it('should return fallback language when there is no detected language', async () => {
    await expect(getPhrase([], mockFallbackLanguage)).resolves.toHaveProperty(
      'languageKey',
      mockFallbackLanguage
    );
  });

  it('should return fallback language when all detected languages are unsupported', async () => {
    const detectedLanguages = ['xx-XX', 'yy-YY'];
    await expect(getPhrase(detectedLanguages, mockFallbackLanguage)).resolves.toHaveProperty(
      'languageKey',
      mockFallbackLanguage
    );
  });
});

describe('phrase should be fully translated', () => {
  describe('when both detected language built-in and custom phrases exist', () => {
    it('should merge detected language custom and built-in phrases', async () => {
      await expect(getPhrase([mixedLanguage], mockFallbackLanguage)).resolves.toEqual(mixedPhrase);
    });
  });

  describe('when detected language built-in phrase exists but its custom phrase does not exist', () => {
    it('should be detected language built-in phrase', async () => {
      await expect(getPhrase([builtInOnlyLanguage], mockFallbackLanguage)).resolves.toEqual({
        ...fr,
        languageKey: builtInOnlyLanguage,
      });
    });
  });

  describe('when detected language built-in phrase does not exist but its custom phrase exists', () => {
    describe('when both fallback language built-in and custom phrases exist', () => {
      it('should merge detected language custom phrase with fallback language custom and built-in phrases', async () => {
        await expect(getPhrase([customOnlyLanguage], mixedLanguage)).resolves.toEqual(
          deepmerge(mixedPhrase, customOnlyPhrase)
        );
      });
    });

    describe('when fallback language built-in phrase exists but its custom phrase does not exist', () => {
      it('should merge detected language custom phrase with fallback language built-in phrase', async () => {
        await expect(getPhrase([customOnlyLanguage], builtInOnlyLanguage)).resolves.toEqual(
          deepmerge(fr, customOnlyPhrase)
        );
      });
    });

    describe('when fallback language built-in phrase does not exist but its custom phrase exists', () => {
      it('should merge detected language custom phrase with fallback language custom phrase and english phrase', async () => {
        await expect(getPhrase([customOnlyLanguage], customOnlyFallbackLanguage)).resolves.toEqual(
          deepmerge(deepmerge(mockEnPhrase, customOnlyFallbackPhrase), customOnlyPhrase)
        );
      });
    });

    describe('when neither fallback language built-in nor custom phrase exists', () => {
      it('should merge detected language custom phrase with English phrase', async () => {
        await expect(getPhrase([customOnlyLanguage], unsupportedFallbackLanguage)).resolves.toEqual(
          deepmerge(mockEnPhrase, mockZhHkCustomPhrase)
        );
      });
    });
  });

  describe('when neither detected language built-in nor custom phrase exist', () => {
    describe('when both fallback language built-in and custom phrases exist', () => {
      it('should merge fallback language custom and built-in phrases', async () => {
        await expect(getPhrase([unsupportedLanguage], mixedLanguage)).resolves.toEqual(mixedPhrase);
      });
    });

    describe('when fallback language built-in phrase exists but its custom phrase does not exist', () => {
      it('should be fallback language built-in phrase', async () => {
        await expect(getPhrase([builtInOnlyLanguage], builtInOnlyLanguage)).resolves.toEqual(
          builtInOnlyPhrase
        );
      });
    });

    describe('when fallback language built-in phrase does not exist but its custom phrase exists', () => {
      it('should merge fallback language custom phrase and english phrase', async () => {
        await expect(
          getPhrase([unsupportedFallbackLanguage], customOnlyFallbackLanguage)
        ).resolves.toEqual(deepmerge(mockEnPhrase, customOnlyFallbackPhrase));
      });
    });

    describe('when neither fallback language built-in nor custom phrase exists', () => {
      it('should be English phrase', async () => {
        await expect(
          getPhrase([unsupportedLanguage], unsupportedFallbackLanguage)
        ).resolves.toEqual(mockEnPhrase);
      });
    });
  });
});
