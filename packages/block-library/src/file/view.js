/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';
/**
 * Internal dependencies
 */
import { browserSupportsPdfs } from './utils';

store(
	'core/file',
	{
		state: {
			get hasPdfPreview() {
				return browserSupportsPdfs();
			},
		},
	},
	{ lock: true }
);
