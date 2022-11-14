import { z } from 'zod';
export declare const googleConfigGuard: z.ZodObject<{
    clientId: z.ZodString;
    clientSecret: z.ZodString;
}, "strip", z.ZodTypeAny, {
    clientId: string;
    clientSecret: string;
}, {
    clientId: string;
    clientSecret: string;
}>;
export declare type GoogleConfig = z.infer<typeof googleConfigGuard>;
export declare const accessTokenResponseGuard: z.ZodObject<{
    access_token: z.ZodString;
    scope: z.ZodString;
    token_type: z.ZodString;
}, "strip", z.ZodTypeAny, {
    scope: string;
    access_token: string;
    token_type: string;
}, {
    scope: string;
    access_token: string;
    token_type: string;
}>;
export declare type AccessTokenResponse = z.infer<typeof accessTokenResponseGuard>;
export declare const userInfoResponseGuard: z.ZodObject<{
    sub: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    given_name: z.ZodOptional<z.ZodString>;
    family_name: z.ZodOptional<z.ZodString>;
    picture: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    email_verified: z.ZodOptional<z.ZodBoolean>;
    locale: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    given_name?: string | undefined;
    family_name?: string | undefined;
    picture?: string | undefined;
    email?: string | undefined;
    email_verified?: boolean | undefined;
    locale?: string | undefined;
    sub: string;
}, {
    name?: string | undefined;
    given_name?: string | undefined;
    family_name?: string | undefined;
    picture?: string | undefined;
    email?: string | undefined;
    email_verified?: boolean | undefined;
    locale?: string | undefined;
    sub: string;
}>;
export declare type UserInfoResponse = z.infer<typeof userInfoResponseGuard>;
export declare const authResponseGuard: z.ZodObject<{
    code: z.ZodString;
    redirectUri: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    redirectUri: string;
}, {
    code: string;
    redirectUri: string;
}>;
