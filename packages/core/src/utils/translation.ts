import en from '@logto/phrases-ui/lib/locales/en';
import { Translation, translationGuard } from '@logto/schemas';
import { z } from 'zod';

const isTranslation = (data: unknown): data is Translation =>
  translationGuard.safeParse(data).success;

export const isFullyTranslated = (fullTranslation: Translation, targetTranslation: Translation) => {
  const fullKeyValues = Object.entries(fullTranslation);
  const targetKeys = new Set(Object.keys(targetTranslation));

  if (
    fullKeyValues.length !== targetKeys.size ||
    !fullKeyValues.every(([key, _]) => targetKeys.has(key))
  ) {
    return false;
  }

  for (const [key, value] of fullKeyValues) {
    const targetValue = targetTranslation[key];

    if (!targetValue) {
      return false;
    }

    if (typeof value === 'string') {
      if (typeof targetValue === 'string') {
        continue;
      }

      return false;
    }

    if (typeof targetValue === 'string' || !isFullyTranslated(value, targetValue)) {
      return false;
    }
  }

  return true;
};

export const fullTranslationGuard: z.ZodType<Translation> = z
  .any()
  .superRefine((value: unknown, ctx) => {
    if (!isTranslation(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid structure.',
      });

      return false;
    }

    if (!isFullyTranslated(en.translation, value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Not fully translated.',
      });

      return false;
    }

    return true;
  });
