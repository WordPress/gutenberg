/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';
/**
 * Internal dependencies
 */
import { browserSupportsPdfs } from './utils';

store( 'core', {
	state: {
		get hasPdfPreview() {
			return browserSupportsPdfs() ? 'inherit' : 'none';
		},
	},
} );
