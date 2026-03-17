/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

// Used as a unique identifier for the "Create" option within search results.
// Used to help distinguish the "Create" suggestion within the search results in
// order to handle it as a unique case.
export const CREATE_TYPE = '__CREATE__';
export const TEL_TYPE = 'tel';
export const URL_TYPE = 'link';
export const MAILTO_TYPE = 'mailto';
export const INTERNAL_TYPE = 'internal';

export const LINK_ENTRY_TYPES = [
	URL_TYPE,
	MAILTO_TYPE,
	TEL_TYPE,
	INTERNAL_TYPE,
];

export const DEFAULT_LINK_SETTINGS = [
	{
		id: 'opensInNewTab',
		title: __( 'Open in new tab' ),
	},
];
