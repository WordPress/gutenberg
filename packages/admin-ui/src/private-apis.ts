/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { getAdminThemeColors } from './admin-theme-colors';

export const privateApis = {};
lock( privateApis, {
	getAdminThemeColors,
} );
