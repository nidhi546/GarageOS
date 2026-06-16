// mechanicApi — thin wrapper over appuser filtered by role: 'mechanic'
// Single source of truth: all staff accounts live in the 'appuser' collection.
import { getRandomValues } from 'expo-crypto';
import { appuserApi, AppUser, UpdateAppUserPayload } from './appuserApi';

// UMD module — use require() to avoid Babel interop helpers that break on Hermes.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RNBcrypt = require('react-native-bcrypt') as typeof import('react-native-bcrypt');

// Hermes doesn't seed Math.random for the RC4 PRNG; supply a real fallback.
RNBcrypt.setRandomFallback((len: number) => {
  const buf = new Uint8Array(len);
  getRandomValues(buf);
  return Array.from(buf);
});

export type HanaMechanicRecord = AppUser;

export interface CreateMechanicPayload {
  legalname: string;
  name: string;
  mobile: string;
  email?: string;
  password: string;
  experience?: string;
  specialization?: string;
  address?: string;
}

export type UpdateMechanicPayload = UpdateAppUserPayload;

const MECHANIC_ROLE_ID = '1777267982585';

function hashPassword(plain: string): Promise<string> {
  return new Promise((resolve, reject) => {
    RNBcrypt.genSalt(12, (saltErr: any, salt: string) => {
      if (saltErr) { reject(saltErr); return; }
      RNBcrypt.hash(plain, salt, (hashErr: any, hash: string) => {
        if (hashErr) { reject(hashErr); return; }
        resolve(hash);
      });
    });
  });
}

export const mechanicApi = {
  getAll: (opts?: { includeInactive?: boolean }) => appuserApi.getAll(MECHANIC_ROLE_ID, opts),

  create: async (payload: CreateMechanicPayload) => {
    const hashedPassword = await hashPassword(payload.password);
    return appuserApi.create({
      ...payload,
      password: hashedPassword,
      role:     MECHANIC_ROLE_ID,
      roleId:   MECHANIC_ROLE_ID,
      roleName: MECHANIC_ROLE_ID,
      provider: 'local',
      status:   'active',
    });
  },

  update:     (id: string, p: UpdateMechanicPayload) => appuserApi.update(id, p),
  activate:   (id: string)                           => appuserApi.activate(id),
  deactivate: (id: string)                           => appuserApi.deactivate(id),
  delete:     (id: string)                           => appuserApi.delete(id),
};
