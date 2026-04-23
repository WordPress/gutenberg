/**
 * Internal dependencies
 */
import { DashboardGrid } from './grid';
import { lock } from './lock-unlock';

export const privateApis: Record< string, never > = {};
lock( privateApis, {
	DashboardGrid,
} );
