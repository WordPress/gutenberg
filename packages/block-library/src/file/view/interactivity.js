/**
 * Internal dependencies
 */
import { store } from '../../utils/interactivity';
import { browserSupportsPdfs } from '../utils';

store( {
	effects: {
		core: {
			file: {
				init( { ref } ) {
					if ( browserSupportsPdfs() ) {
						ref.removeAttribute( 'hidden' );
					}
				},
			},
		},
	},
} );
