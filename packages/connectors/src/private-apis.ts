/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { store, STORE_NAME } from './store';

export const privateApis: Record< string, never > = {};
lock( privateApis, { store, STORE_NAME } );
