import { sql } from 'slonik';

import { AlterationScript } from '../lib/types/alteration';

const alteration: AlterationScript = {
  up: async (pool) => {
    await pool.query(sql`
      create table _logto_configs (
        key varchar(256) not null,
        value jsonb /* @use ArbitraryObject */ not null default '{}'::jsonb,
        primary key (key)
      );
    `);
  },
  down: async (pool) => {
    await pool.query(sql`drop table _logto_configs;`);
  },
};

export default alteration;
