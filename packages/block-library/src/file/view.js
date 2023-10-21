/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';
/**
 * Internal dependencies
 */
import { browserSupportsPdfs } from './utils';

store( {
	selectors: {
		core: {
			file: {
				hasPdfPreview: browserSupportsPdfs() ? 'inherit' : 'none',
			},
		},
	},
} );
