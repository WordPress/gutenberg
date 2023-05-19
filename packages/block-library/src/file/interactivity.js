/**
 * Internal dependencies
 */
import { store } from '../utils/interactivity';
import { browserSupportsPdfs as hasPdfPreview } from './utils';

store( {
	selectors: {
		core: {
			file: {
				hasPdfPreview,
			},
		},
	},
} );
