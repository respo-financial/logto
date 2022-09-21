import { adminConsoleApplicationId, adminConsoleSignInExperience } from '@logto/schemas/lib/seeds';
import { Provider } from 'oidc-provider';

import { mockSignInExperience } from '@/__mocks__';
import { mockZhCnCustomPhrase, koKrKey, trTrKey, zhCnKey } from '@/__mocks__/custom-phrase';
import * as detectLanguage from '@/i18n/detect-language';
import phraseRoutes from '@/routes/phrase';
import { createRequester } from '@/utils/test-utils';

const mockLanguageKey = zhCnKey;

const mockApplicationId = 'mockApplicationIdValue';

const interactionDetails: jest.MockedFunction<() => Promise<unknown>> = jest.fn(async () => ({
  params: { client_id: mockApplicationId },
}));

jest.mock('oidc-provider', () => ({
  Provider: jest.fn(() => ({
    interactionDetails,
  })),
}));

const findDefaultSignInExperience = jest.fn(async () => mockSignInExperience);

jest.mock('@/queries/sign-in-experience', () => ({
  findDefaultSignInExperience: async () => findDefaultSignInExperience(),
}));

const getPhrase = jest.fn(
  async (detectedLanguages: string[], fallbackLanguage: string) => mockZhCnCustomPhrase
);

jest.mock('@/lib/phrase', () => ({
  getPhrase: async (detectedLanguages: string[], fallbackLanguage: string) =>
    getPhrase(detectedLanguages, fallbackLanguage),
}));

const detectLanguageSpy = jest.spyOn(detectLanguage, 'default');

const phraseRequest = createRequester({
  anonymousRoutes: phraseRoutes,
  provider: new Provider(''),
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('when the application is admin-console', () => {
  beforeEach(() => {
    interactionDetails.mockResolvedValueOnce({
      params: { client_id: adminConsoleApplicationId },
    });
  });

  it('should call interactionDetails', async () => {
    await phraseRequest.get('/phrase');
    expect(interactionDetails).toBeCalledTimes(1);
  });

  it('should not call findDefaultSignInExperience', async () => {
    await phraseRequest.get('/phrase');
    expect(findDefaultSignInExperience).not.toBeCalled();
  });

  it('should call detectLanguageSpy and getPhrase with specified detected languages and fallback language', async () => {
    await phraseRequest.get('/phrase').set('Accept-Language', mockLanguageKey);
    expect(detectLanguageSpy).toBeCalledTimes(1);
    expect(getPhrase).toBeCalledWith(
      [mockLanguageKey],
      adminConsoleSignInExperience.languageInfo.fallbackLanguage
    );
  });
});

describe('when the application is not admin-console', () => {
  beforeEach(() => {
    interactionDetails.mockResolvedValueOnce({
      params: { client_id: mockApplicationId },
    });
  });

  it('should call interactionDetails', async () => {
    await phraseRequest.get('/phrase');
    expect(interactionDetails).toBeCalledTimes(1);
  });

  it('should not call findDefaultSignInExperience', async () => {
    await phraseRequest.get('/phrase');
    expect(findDefaultSignInExperience).toBeCalledTimes(1);
  });

  it('should call detectLanguageSpy and getPhrase with specified detected languages and fallback language', async () => {
    const fallbackLanguage = trTrKey;
    findDefaultSignInExperience.mockResolvedValueOnce({
      ...mockSignInExperience,
      languageInfo: {
        autoDetect: true,
        fallbackLanguage,
        fixedLanguage: trTrKey,
      },
    });
    await phraseRequest.get('/phrase').set('Accept-Language', `${mockLanguageKey},${koKrKey}`);
    expect(detectLanguageSpy).toBeCalledTimes(1);
    expect(getPhrase).toBeCalledWith([mockLanguageKey, koKrKey], fallbackLanguage);
  });
});
