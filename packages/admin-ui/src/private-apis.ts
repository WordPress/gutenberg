/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { UserThemeProvider } from './user-theme-provider';

export const privateApis = {};
lock( privateApis, {
	UserThemeProvider,
} );
