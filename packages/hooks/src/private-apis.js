/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { privateHooksMap } from './private-hooks';

export const privateApis = {};

lock( privateApis, { privateHooksMap } );
