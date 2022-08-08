import fs from 'fs/promises';
import path from 'path';

import { SmsConnector } from '@logto/connector-base-classes';
import {
  ConnectorError,
  ConnectorErrorCodes,
  SmsSendMessageByFunction,
  GetConnectorConfig,
} from '@logto/connector-types';
import { assert } from '@silverhand/essentials';

import { defaultMetadata } from './constant';
import { mockSmsConfigGuard, MockSmsConfig } from './types';

export default class MockSmsConnector extends SmsConnector<MockSmsConfig> {
  constructor(getConnectorConfig: GetConnectorConfig) {
    super(getConnectorConfig);
    this.metadata = defaultMetadata;
    // eslint-disable-next-line unicorn/prefer-module
    this.metadataParser(__dirname);
  }

  public validateConfig(config: unknown): asserts config is MockSmsConfig {
    const result = mockSmsConfigGuard.safeParse(config);

    if (!result.success) {
      throw new ConnectorError(ConnectorErrorCodes.InvalidConfig, result.error);
    }
  }

  protected readonly sendMessageBy: SmsSendMessageByFunction<MockSmsConfig> = async (
    config,
    phone,
    type,
    data
  ) => {
    const { templates } = config;
    const template = templates.find((template) => template.usageType === type);

    assert(
      template,
      new ConnectorError(
        ConnectorErrorCodes.TemplateNotFound,
        `Template not found for type: ${type}`
      )
    );

    await fs.writeFile(
      path.join('/tmp', 'logto_mock_passcode_record.txt'),
      JSON.stringify({ phone, code: data.code, type }) + '\n'
    );

    return { phone, data };
  };
}
