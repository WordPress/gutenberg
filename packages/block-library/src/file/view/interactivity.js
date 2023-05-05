/**
 * Internal dependencies
 */
import { store } from '../../utils/interactivity';
import { hidePdfEmbedsOnUnsupportedBrowsers } from '../utils';

store( {
	effects: {
		core: {
			file: {
				init() {
					hidePdfEmbedsOnUnsupportedBrowsers();
				},
			},
		},
	},
} );
