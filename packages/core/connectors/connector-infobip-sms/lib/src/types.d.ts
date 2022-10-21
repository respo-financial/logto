import { Nullable } from '@silverhand/essentials';
import { z } from 'zod';
declare type Destination = {
    to: string;
};
declare type Message = {
    from: string;
    destinations: Destination[];
    text: string;
    regional: {
        indiaDlt: {
            contentTemplateId: string;
            principalEntityId: string;
        };
    };
};
export declare type PublicParameters = {
    messages: [Message];
};
export declare const infobipSmsConfigGuard: z.ZodObject<{
    accountSID: z.ZodString;
    apiKey: z.ZodString;
    from: z.ZodString;
    contentTemplateId: z.ZodString;
    principalEntityId: z.ZodString;
    templates: z.ZodArray<z.ZodObject<{
        usageType: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        usageType: string;
        content: string;
    }, {
        usageType: string;
        content: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    accountSID: string;
    apiKey: string;
    from: string;
    contentTemplateId: string;
    principalEntityId: string;
    templates: {
        usageType: string;
        content: string;
    }[];
}, {
    accountSID: string;
    apiKey: string;
    from: string;
    contentTemplateId: string;
    principalEntityId: string;
    templates: {
        usageType: string;
        content: string;
    }[];
}>;
export declare type InfobipSmsConfig = z.infer<typeof infobipSmsConfigGuard>;
export declare type SendSmsResponse = {
    messages: [
        {
            messageId: string;
            status: {
                description: Nullable<string>;
                groupId: number;
                groupName: Nullable<string>;
                id: number;
                name: Nullable<string>;
            };
            to: number;
        }
    ];
};
export {};
