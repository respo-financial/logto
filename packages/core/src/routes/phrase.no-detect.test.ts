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
  .mockResolvedValue({
    ...mockSignInExperience,
    languageInfo: {
      autoDetect: false,
      fallbackLanguage: zhCnKey,
      fixedLanguage: koKrKey,
    },
  });

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

it('should return `en` language when fallback language is unsupported', async () => {
  signInExperienceQuerySpy.mockResolvedValueOnce({
    ...mockSignInExperience,
    languageInfo: {
      autoDetect: false,
      // @ts-expect-error unsupported language
      fallbackLanguage: 'zz-ZZ',
      fixedLanguage: koKrKey,
    },
  });
  const disabledDetectResponse = await phraseRequest.get('/phrase').set('Accept-Language', 'xx-XX');
  expect(disabledDetectResponse.status).toEqual(200);
  expect(disabledDetectResponse.body).toHaveProperty('languageKey', enKey);
});

describe('when fallback language is supported', () => {
  it('should not call detectLanguage', async () => {
    signInExperienceQuerySpy.mockResolvedValueOnce({
      ...mockSignInExperience,
      languageInfo: {
        ...mockSignInExperience.languageInfo,
        autoDetect: false,
      },
    });
    await phraseRequest.get('/phrase').set('Accept-Language', '*');
    expect(detectLanguageSpy).not.toBeCalled();
  });

  it('should return fallback language', async () => {
    const fallbackLanguage = trTrKey;
    signInExperienceQuerySpy.mockResolvedValueOnce({
      ...mockSignInExperience,
      languageInfo: {
        autoDetect: false,
        fallbackLanguage,
        fixedLanguage: koKrKey,
      },
    });
    const response = await phraseRequest.get('/phrase').set('Accept-Language', koKrKey);
    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('languageKey', fallbackLanguage);
  });
});

describe('phrase returned should be fully translated', () => {
  describe('when both fallback language built-in and custom phrases exist', () => {
    it('should merge fallback language custom and built-in phrases', async () => {
      signInExperienceQuerySpy.mockResolvedValueOnce({
        ...mockSignInExperience,
        languageInfo: {
          autoDetect: false,
          fallbackLanguage: zhCnKey,
          fixedLanguage: koKrKey,
        },
      });
      const response = await phraseRequest.get('/phrase').set('Accept-Language', koKrKey);
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
          autoDetect: false,
          fallbackLanguage: builtInOnlyLanguage,
          fixedLanguage: koKrKey,
        },
      });
      const response = await phraseRequest.get('/phrase').set('Accept-Language', koKrKey);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(builtInOnlyPhrase);
    });
  });

  describe('when fallback language built-in phrase does not exist but its custom phrase exists', () => {
    it('should merge fallback language custom phrase and english phrase', async () => {
      const customOnlyLanguage = zhTwKey;
      signInExperienceQuerySpy.mockResolvedValueOnce({
        ...mockSignInExperience,
        languageInfo: {
          autoDetect: false,
          // @ts-expect-error custom language not listed in LanguageKey enum for now
          fallbackLanguage: customOnlyLanguage,
          fixedLanguage: koKrKey,
        },
      });
      const response = await phraseRequest.get('/phrase').set('Accept-Language', koKrKey);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(deepmerge(mockEnPhrase, mockZhTwCustomPhrase));
    });
  });

  describe('when neither fallback language built-in nor custom phrase exists', () => {
    it('should be English phrase', async () => {
      signInExperienceQuerySpy.mockResolvedValueOnce({
        ...mockSignInExperience,
        languageInfo: {
          autoDetect: false,
          // @ts-expect-error unsupported language
          fallbackLanguage: 'zz-ZZ',
          fixedLanguage: koKrKey,
        },
      });
      const response = await phraseRequest.get('/phrase').set('Accept-Language', koKrKey);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual(mockEnPhrase);
    });
  });
});
