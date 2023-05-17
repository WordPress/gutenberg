/**
 * Internal dependencies
 */
import { store } from '../utils/interactivity';
import { browserSupportsPdfs } from './utils';

store( {
	selectors: {
		core: {
			file: {
				hasNoPdfPreview() {
					return ! browserSupportsPdfs();
				},
			},
		},
	},
} );
