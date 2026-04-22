const { query } = require('../db/pool');

async function get(phone) {
  const { rows } = await query('SELECT * FROM sessions WHERE phone=$1', [phone]);
  if (rows[0]) return rows[0];
  const inserted = await query(
    'INSERT INTO sessions (phone, flow, step, data) VALUES ($1,NULL,NULL,$2) RETURNING *',
    [phone, {}]
  );
  return inserted.rows[0];
}

async function setFlow(phone, flow, step = 'start', data = {}) {
  const { rows } = await query(
    `INSERT INTO sessions (phone, flow, step, data, updated_at)
     VALUES ($1,$2,$3,$4,NOW())
     ON CONFLICT (phone) DO UPDATE SET flow=$2, step=$3, data=$4, updated_at=NOW()
     RETURNING *`,
    [phone, flow, step, data]
  );
  return rows[0];
}

async function setStep(phone, step, dataPatch = {}) {
  const session = await get(phone);
  const data = { ...(session.data || {}), ...dataPatch };
  const { rows } = await query(
    'UPDATE sessions SET step=$2, data=$3, updated_at=NOW() WHERE phone=$1 RETURNING *',
    [phone, step, data]
  );
  return rows[0];
}

async function patchData(phone, dataPatch) {
  const session = await get(phone);
  const data = { ...(session.data || {}), ...dataPatch };
  const { rows } = await query(
    'UPDATE sessions SET data=$2, updated_at=NOW() WHERE phone=$1 RETURNING *',
    [phone, data]
  );
  return rows[0];
}

async function reset(phone) {
  await query('UPDATE sessions SET flow=NULL, step=NULL, data=$2, updated_at=NOW() WHERE phone=$1', [phone, {}]);
}

module.exports = { get, setFlow, setStep, patchData, reset };
