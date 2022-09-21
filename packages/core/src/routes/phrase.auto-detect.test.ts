import fr from '@logto/phrases-ui/lib/locales/fr';
import zhCN from '@logto/phrases-ui/lib/locales/zh-cn';
import { CustomPhrase } from '@logto/schemas';
import deepmerge from 'deepmerge';
import { Provider } from 'oidc-provider';

import { mockSignInExperience } from '@/__mocks__';
import {
  mockEnCustomPhrase,
  enKey,
  mockEnPhrase,
  frKey,
  koKrKey,
  mockTrTrCustomPhrase,
  trTrKey,
  mockZhCnCustomPhrase,
  zhCnKey,
  mockZhHkCustomPhrase,
  zhHkKey,
  mockZhTwCustomPhrase,
  zhTwKey,
} from '@/__mocks__/custom-phrase';
import RequestError from '@/errors/RequestError';
import * as detectLanguage from '@/i18n/detect-language';
import * as signInExperienceQueries from '@/queries/sign-in-experience';
import phraseRoutes from '@/routes/phrase';
import { createRequester } from '@/utils/test-utils';

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

const signInExperienceQuerySpy = jest
  .spyOn(signInExperienceQueries, 'findDefaultSignInExperience')
  .mockResolvedValue(mockSignInExperience);

const mockApplicationId = 'mockApplicationIdValue';

const interactionDetails: jest.MockedFunction<() => Promise<unknown>> = jest.fn(async () => ({
  params: { client_id: mockApplicationId },
}));

jest.mock('oidc-provider', () => ({
  Provider: jest.fn(() => ({
    interactionDetails,
  })),
}));

const detectLanguageSpy = jest.spyOn(detectLanguage, 'default');

const phraseRequest = createRequester({
  anonymousRoutes: phraseRoutes,
  provider: new Provider(''),
});

afterEach(() => {
  jest.clearAllMocks();
});

it('should return `en` language when neither fallback nor detected languages are supported', async () => {
  signInExperienceQuerySpy.mockResolvedValueOnce({
    ...mockSignInExperience,
    languageInfo: {
      autoDetect: true,
      // @ts-expect-error unsupported language
      fallbackLanguage: 'zz-ZZ',
      fixedLanguage: koKrKey,
    },
  });
  const autoDetectResponse = await phraseRequest
    .get('/phrase')
    .set('Accept-Language', 'xx-XX,yy-YY');
  expect(autoDetectResponse.status).toEqual(200);
  expect(autoDetectResponse.body).toHaveProperty('languageKey', enKey);
});

describe('When fallback language is supported', () => {
  const fallbackLanguage = zhCnKey;

  beforeEach(() => {
    signInExperienceQuerySpy.mockResolvedValueOnce({
      ...mockSignInExperience,
      languageInfo: {
        autoDetect: true,
        fallbackLanguage,
        fixedLanguage: koKrKey,
      },
    });
  });

  it('should call detectLanguage', async () => {
    await phraseRequest.get('/phrase');
    expect(detectLanguageSpy).toBeCalledTimes(1);
  });

  it('should return first supported detected language', async () => {
    const supportedLanguage = zhCnKey;
    const response = await phraseRequest
      .get('/phrase')
      .set('Accept-Language', `xx-XX,${supportedLanguage},${trTrKey}`);
    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('languageKey', supportedLanguage);
  });

  it('should return fallback language when there is no Accept-Language header', async () => {
    const response = await phraseRequest.get('/phrase');
    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('languageKey', fallbackLanguage);
  });

  it('should return fallback language when Accept-Language header is "*"', async () => {
    const response = await phraseRequest.get('/phrase').set('Accept-Language', '*');
    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('languageKey', fallbackLanguage);
  });

  it('should return fallback language when all detected languages (from Accept-Language header) are unsupported', async () => {
    const response = await phraseRequest.get('/phrase').set('Accept-Language', 'xx-XX,yy-YY');
    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('languageKey', fallbackLanguage);
  });
});

describe('phrase returned should be fully translated', () => {
  describe('when both detected language built-in and custom phrases exist', () => {
    it('should merge detected language custom and built-in phrases', async () => {
      const response = await phraseRequest.get('/phrase').set('Accept-Language', zhCnKey);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(deepmerge(zhCN, mockZhCnCustomPhrase));
    });
  });

  describe('when detected language built-in phrase exists but its custom phrase does not exist', () => {
    it('should be detected language built-in phrase', async () => {
      const builtInOnlyLanguage = frKey;
      const response = await phraseRequest
        .get('/phrase')
        .set('Accept-Language', builtInOnlyLanguage);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ ...fr, languageKey: builtInOnlyLanguage });
    });
  });

  describe('when detected language built-in phrase does not exist but its custom phrase exists', () => {
    describe('when both fallback language built-in and custom phrases exist', () => {
      it('should merge detected language custom phrase with fallback language custom and built-in phrases', async () => {
        const customOnlyLanguage = zhHkKey;
        signInExperienceQuerySpy.mockResolvedValueOnce({
          ...mockSignInExperience,
          languageInfo: {
            autoDetect: true,
            fallbackLanguage: zhCnKey,
            fixedLanguage: koKrKey,
          },
        });
        const response = await phraseRequest
          .get('/phrase')
          .set('Accept-Language', customOnlyLanguage);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(
          deepmerge(deepmerge(zhCN, mockZhCnCustomPhrase), mockZhHkCustomPhrase)
        );
      });
    });

    describe('when fallback language built-in phrase exists but its custom phrase does not exist', () => {
      it('should merge detected language custom phrase with fallback language built-in phrase', async () => {
        const customOnlyLanguage = zhHkKey;
        const builtInOnlyLanguage = frKey;
        const builtInOnlyPhrase = fr;
        signInExperienceQuerySpy.mockResolvedValueOnce({
          ...mockSignInExperience,
          languageInfo: {
            autoDetect: true,
            fallbackLanguage: builtInOnlyLanguage,
            fixedLanguage: koKrKey,
          },
        });
        const response = await phraseRequest
          .get('/phrase')
          .set('Accept-Language', customOnlyLanguage);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(deepmerge(builtInOnlyPhrase, mockZhHkCustomPhrase));
      });
    });

    describe('when fallback language built-in phrase does not exist but its custom phrase exists', () => {
      it('should merge detected language custom phrase with fallback language custom phrase and english phrase', async () => {
        const customOnlyLanguage = zhHkKey;
        const customOnlyFallbackLanguage = zhTwKey;
        signInExperienceQuerySpy.mockResolvedValueOnce({
          ...mockSignInExperience,
          languageInfo: {
            autoDetect: true,
            // @ts-expect-error custom language not listed in LanguageKey enum for now
            fallbackLanguage: customOnlyFallbackLanguage,
            fixedLanguage: koKrKey,
          },
        });
        const response = await phraseRequest
          .get('/phrase')
          .set('Accept-Language', customOnlyLanguage);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(
          deepmerge(deepmerge(mockEnPhrase, mockZhTwCustomPhrase), mockZhHkCustomPhrase)
        );
      });
    });

    describe('when neither fallback language built-in nor custom phrase exists', () => {
      it('should merge detected language custom phrase with English phrase', async () => {
        const customOnlyLanguage = zhHkKey;
        signInExperienceQuerySpy.mockResolvedValueOnce({
          ...mockSignInExperience,
          languageInfo: {
            autoDetect: true,
            // @ts-expect-error unsupported language
            fallbackLanguage: 'zz-ZZ',
            fixedLanguage: koKrKey,
          },
        });
        const response = await phraseRequest
          .get('/phrase')
          .set('Accept-Language', customOnlyLanguage);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(deepmerge(mockEnPhrase, mockZhHkCustomPhrase));
      });
    });
  });

  describe('when neither detected language built-in nor custom phrase exist', () => {
    const nonexistentLanguage = 'xx-XX';

    describe('when both fallback language built-in and custom phrases exist', () => {
      it('should merge fallback language custom and built-in phrases', async () => {
        signInExperienceQuerySpy.mockResolvedValueOnce({
          ...mockSignInExperience,
          languageInfo: {
            autoDetect: true,
            fallbackLanguage: zhCnKey,
            fixedLanguage: koKrKey,
          },
        });
        const response = await phraseRequest
          .get('/phrase')
          .set('Accept-Language', nonexistentLanguage);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(deepmerge(zhCN, mockZhCnCustomPhrase));
      });
    });

    describe('when fallback language built-in phrase exists but its custom phrase does not exist', () => {
      it('should be fallback language built-in phrase', async () => {
        const builtInOnlyLanguage = frKey;
        const builtInOnlyPhrase = { ...fr, languageKey: frKey };
        signInExperienceQuerySpy.mockResolvedValueOnce({
          ...mockSignInExperience,
          languageInfo: {
            autoDetect: true,
            fallbackLanguage: builtInOnlyLanguage,
            fixedLanguage: koKrKey,
          },
        });
        const response = await phraseRequest
          .get('/phrase')
          .set('Accept-Language', nonexistentLanguage);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(builtInOnlyPhrase);
      });
    });

    describe('when fallback language built-in phrase does not exist but its custom phrase exists', () => {
      it('should merge fallback language custom phrase and english phrase', async () => {
        const customOnlyFallbackLanguage = zhTwKey;
        signInExperienceQuerySpy.mockResolvedValueOnce({
          ...mockSignInExperience,
          languageInfo: {
            autoDetect: true,
            // @ts-expect-error custom language not listed in LanguageKey enum for now
            fallbackLanguage: customOnlyFallbackLanguage,
            fixedLanguage: koKrKey,
          },
        });
        const response = await phraseRequest
          .get('/phrase')
          .set('Accept-Language', nonexistentLanguage);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(deepmerge(mockEnPhrase, mockZhTwCustomPhrase));
      });
    });

    describe('when neither fallback language built-in nor custom phrase exists', () => {
      it('should be English phrase', async () => {
        signInExperienceQuerySpy.mockResolvedValueOnce({
          ...mockSignInExperience,
          languageInfo: {
            autoDetect: true,
            // @ts-expect-error unsupported language
            fallbackLanguage: 'zz-ZZ',
            fixedLanguage: koKrKey,
          },
        });
        const response = await phraseRequest
          .get('/phrase')
          .set('Accept-Language', nonexistentLanguage);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(mockEnPhrase);
      });
    });
  });
});
