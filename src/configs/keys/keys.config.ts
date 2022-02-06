import { readFileSync } from 'fs';
import { join } from 'path';

export const getPublicKey = (): string => {
    return readFileSync(join(__dirname + '/public.key')).toString();
};
