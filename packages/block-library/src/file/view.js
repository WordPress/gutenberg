import { store } from '@wordpress/interactivity';
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
