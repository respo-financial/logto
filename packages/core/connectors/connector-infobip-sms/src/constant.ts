import { ConnectorMetadata } from "@logto/connector-kit";

export const endpoint = 'https://{{accountSID}}.api.infobip.com'+'/sms/2/text/advanced';

export const defaultMetadata: ConnectorMetadata = {
    id: 'infobip-short-message-service',
    target: 'infobip-sms',
    platform: null,
    name: {
      en: 'Infobip SMS Service'
    },
    logo: './logo.svg',
    logoDark: null,
    description: {
      en: 'Infobip provides programmable communication tools for sms.',
    },
    readme: './README.md',
    configTemplate: './docs/config-template.json',
  };