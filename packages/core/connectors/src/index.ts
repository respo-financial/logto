import { infobipSmsConfigGuard, InfobipSmsConfig, PublicParameters } from './types';
import {
    ConnectorError,
    ConnectorErrorCodes,
    GetConnectorConfig,
    SendMessageFunction,
    validateConfig,
    CreateConnector,
    SmsConnector,
    ConnectorType,
} from '@logto/connector-kit';
import { assert } from '@silverhand/essentials';
import { defaultMetadata, endpoint } from './constant';

import got, { HTTPError } from 'got';

const sendMessage = 
(getConfig: GetConnectorConfig): SendMessageFunction =>
async (data, inputConfig) => {
    const { to, type, payload } = data;
    const config = inputConfig ?? (await getConfig(defaultMetadata.id));
    validateConfig<InfobipSmsConfig>(config, infobipSmsConfigGuard);
    const { accountSID, apiKey, templates, from, contentTemplateId, principalEntityId} = config;
    const template = templates.find((template) => template.usageType === type);

    assert(
    template,
    new ConnectorError(
        ConnectorErrorCodes.TemplateNotFound,
        `Cannot find template for type: ${type}`
    )
    );

    const parameters: PublicParameters = {
        messages:[
            {
                from:from,
                destinations:[{to:to}],
                text:typeof payload.code === 'string'
                        ? template.content.replace(/{{code}}/g, payload.code)
                        : template.content,
                regional:{
                    indiaDlt:{
                        contentTemplateId:contentTemplateId,
                        principalEntityId:principalEntityId
                    }
                }
            }
        ]
    };

    // typeof payload.code === 'string'
    //         ? template.content.replace(/{{code}}/g, payload.code)
    //         : template.content,
    try {
        console.log(`API URL is ${endpoint.replace(/{{accountSID}}/g, accountSID)}`)
        console.log(`Body is ${JSON.stringify(parameters)}`)
        return await got.post(endpoint.replace(/{{accountSID}}/g, accountSID), {
        headers: {
            Authorization:apiKey,
            'Content-Type': 'application/json',
            'Accept' : 'application/json'
        },
        body: JSON.stringify(parameters),
        });
    } catch (error: unknown) {
        console.log("Error id" +error)
        if (error instanceof HTTPError) {
        const {
            response: { body: rawBody },
        } = error;
        assert(
            typeof rawBody === 'string',
            new ConnectorError(ConnectorErrorCodes.InvalidResponse)
        );

        throw new ConnectorError(ConnectorErrorCodes.General, rawBody);
        }

        throw error;
    }  
}

const createInfobipSmsConnector: CreateConnector<SmsConnector> = async ({ getConfig }) => {
    return {
    metadata: defaultMetadata,
    type: ConnectorType.Sms,
    configGuard: infobipSmsConfigGuard,
    sendMessage: sendMessage(getConfig),
    };
};

export default createInfobipSmsConnector;