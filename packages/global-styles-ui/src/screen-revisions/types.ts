/**
 * WordPress dependencies
 */
import type { GlobalStylesConfig } from '@wordpress/global-styles-engine';

export interface User {
	id: number;
	name: string;
	avatar_urls: Record< string, string >;
}

export interface Revision extends GlobalStylesConfig {
	id: string | number;
	author?: User;
	modified?: string | Date;
	isLatest?: boolean;
	_links?: any;
}
