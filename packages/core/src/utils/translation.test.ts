import en from '@logto/phrases-ui/lib/locales/en';
import fr from '@logto/phrases-ui/lib/locales/fr';

import { fullTranslationGuard, isFullyTranslated } from '@/utils/translation';

const customizedFrTranslation = {
  ...fr.translation,
  secondary: {
    sign_in_with: 'Customized value A',
    social_bind_with: 'Customized value B',
  },
};

describe('fullTranslationGuard', () => {
  it('should pass when the phrase is fully translated', () => {
    expect(fullTranslationGuard.safeParse(fr.translation).success).toBeTruthy();
    expect(fullTranslationGuard.safeParse(customizedFrTranslation).success).toBeTruthy();
  });

  it('should fail when the input is not a valid translation', () => {
    expect(
      fullTranslationGuard.safeParse({
        a: 123,
        b: { b1: true, b2: false },
        c: { c1: undefined, c2: { n: null } },
      }).success
    ).toBeFalsy();
  });
});

describe('isFullyTranslated', () => {
  it('should pass when it is fully translated', () => {
    expect(isFullyTranslated(en.translation, fr.translation)).toBeTruthy();
    expect(isFullyTranslated(en.translation, customizedFrTranslation)).toBeTruthy();
  });

  test.each(['', undefined, null, {}, true, false])(
    'should fail when there is an unexpected value `%p`',
    (unexpectedValue) => {
      expect(
        isFullyTranslated(en.translation, {
          ...fr.translation,
          secondary: {
            sign_in_with: 'Se connecter avec {{methods, list(type: disjunction;)}}',
            // @ts-expect-error for testing
            social_bind_with: unexpectedValue,
          },
        })
      ).toBeFalsy();
    }
  );

  it('should fail when the translation does not contain a required key-value pair', () => {
    expect(
      isFullyTranslated(en.translation, {
        ...fr.translation,
        secondary: {
          sign_in_with: 'Se connecter avec {{methods, list(type: disjunction;)}}',
          // Missing 'secondary.social_bind_with' key-value pair
        },
      })
    ).toBeFalsy();
  });

  it('should fail when there is an unexpected key-value pair', () => {
    expect(
      isFullyTranslated(en.translation, {
        ...fr.translation,
        secondary: {
          sign_in_with: 'Se connecter avec {{methods, list(type: disjunction;)}}',
          social_bind_with:
            'Vous avez déjà un compte ? Connectez-vous pour lier {{methods, list(type: disjunction;)}} avec votre identité sociale.',
          foo: 'bar', // Unexpected key-value pair
        },
      })
    ).toBeFalsy();
  });
});
