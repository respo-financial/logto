    import { Nullable } from '@silverhand/essentials';
    import { z } from 'zod';

    // export type PublicParameters = {
    //     to: string;
    //     from: string;
    //     messageId: string;
    //     text: string;
    // };
    type Destination ={
        to:string;
    }
    type Message = {
        from: string;
        destinations:Destination[];
        text:string;
        regional:{
            indiaDlt:{
                contentTemplateId:string;
                principalEntityId:string;
            }
        }
    }
    export type PublicParameters = {
            messages:[Message]
        };
    
    const templateGuard = z.object({
        usageType: z.string(),
        content: z.string(),
    });

    export const infobipSmsConfigGuard = z.object({
        accountSID: z.string(),
        apiKey: z.string(),
        from: z.string(),
        contentTemplateId: z.string(),
        principalEntityId: z.string(),
        // fromMessagingServiceSID: z.string(),
        templates: z.array(templateGuard),
    });

    export type InfobipSmsConfig = z.infer<typeof infobipSmsConfigGuard>

    export type SendSmsResponse = {
        messages:[{
            messageId:string;
            status:{
                description:Nullable<string>;
                groupId:number;
                groupName:Nullable<string>;
                id:number;
                name:Nullable<string>;
            };
            to:number;
        }];
    };

