/**
 * WordPress dependencies
 */
import type { WpTemplate } from '@wordpress/core-data';

export type Template = WpTemplate & {
	_isActive: boolean;
};
