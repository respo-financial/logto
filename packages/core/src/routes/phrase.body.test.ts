import resource from '@logto/phrases-ui';
import { CustomPhrase } from '@logto/schemas';
import deepmerge from 'deepmerge';
import { Provider } from 'oidc-provider';

import { mockSignInExperience } from '@/__mocks__';
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
import phraseRoutes from '@/routes/phrase';
import { createRequester } from '@/utils/test-utils';

const mockApplicationId = 'mockApplicationIdValue';

const interactionDetails: jest.MockedFunction<() => Promise<unknown>> = jest.fn(async () => ({
  params: { client_id: mockApplicationId },
}));

jest.mock('oidc-provider', () => ({
  Provider: jest.fn(() => ({
    interactionDetails,
  })),
}));

const fallbackLanguage = trTrKey;

const findDefaultSignInExperience = jest.fn(async () => ({
  ...mockSignInExperience,
  languageInfo: {
    autoDetect: true,
    fallbackLanguage,
    fixedLanguage: fallbackLanguage,
  },
}));

jest.mock('@/queries/sign-in-experience', () => ({
  findDefaultSignInExperience: async () => findDefaultSignInExperience(),
}));

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

const phraseRequest = createRequester({
  anonymousRoutes: phraseRoutes,
  provider: new Provider(''),
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('when the language is English', () => {
  beforeEach(() => {
    findDefaultSignInExperience.mockResolvedValueOnce({
      ...mockSignInExperience,
      languageInfo: {
        autoDetect: false,
        fallbackLanguage: enKey,
        fixedLanguage: enKey,
      },
    });
  });

  it('should be English custom phrase merged with its built-in phrase when its custom phrase exists', async () => {
    findAllCustomLanguageKeys.mockResolvedValueOnce([enKey]);
    const response = await phraseRequest.get('/phrase');
    expect(response.body).toEqual(deepmerge(englishBuiltInPhrase, mockEnCustomPhrase));
  });

  it('should be English built-in phrase when its custom phrase does not exist', async () => {
    findAllCustomLanguageKeys.mockResolvedValueOnce([]);
    const response = await phraseRequest.get('/phrase');
    expect(response.body).toEqual(englishBuiltInPhrase);
  });
});

describe('when the language is not English', () => {
  it('should be custom phrase merged with built-in phrase when both of them exist', async () => {
    const response = await phraseRequest.get('/phrase').set('Accept-Language', customizedLanguage);
    expect(response.body).toEqual(deepmerge(customizedBuiltInPhrase, customizedCustomPhrase));
  });

  it('should be built-in phrase when there is built-in phrase and no custom phrase', async () => {
    const builtInOnlyLanguage = trTrKey;
    const builtInOnlyPhrase = resource[trTrKey];
    const response = await phraseRequest.get('/phrase').set('Accept-Language', builtInOnlyLanguage);
    expect(response.body).toEqual(builtInOnlyPhrase);
  });

  it('should be built-in phrase when there is custom phrase and no built-in phrase', async () => {
    const response = await phraseRequest.get('/phrase').set('Accept-Language', customOnlyLanguage);
    expect(response.body).toEqual(deepmerge(englishBuiltInPhrase, customOnlyCustomPhrase));
  });

  describe('when there is no custom or built-in phrase', () => {
    const unsupportedLanguage = 'xx-XX';

    beforeEach(() => {
      findDefaultSignInExperience.mockResolvedValueOnce({
        ...mockSignInExperience,
        languageInfo: {
          autoDetect: false,
          fallbackLanguage: unsupportedLanguage,
          fixedLanguage: unsupportedLanguage,
        },
      });
    });

    it('should be English custom phrase merged with English built-in phrase when English custom phrase exists', async () => {
      findAllCustomLanguageKeys.mockResolvedValueOnce([enKey]);
      const response = await phraseRequest.get('/phrase');
      expect(response.body).toEqual(deepmerge(englishBuiltInPhrase, mockEnCustomPhrase));
    });

    it('should be English built-in phrase when English custom phrase does not exist', async () => {
      findAllCustomLanguageKeys.mockResolvedValueOnce([]);
      findCustomPhraseByLanguageKey.mockImplementationOnce(async (languageKey: string) => {
        const mockCustomPhrase = mockCustomPhrases[languageKey];

        if (languageKey === enKey || !mockCustomPhrase) {
          throw new RequestError({ code: 'entity.not_found', status: 404 });
        }

        return mockCustomPhrase;
      });

      const response = await phraseRequest.get('/phrase');
      expect(response.body).toEqual(englishBuiltInPhrase);
    });
  });
});
