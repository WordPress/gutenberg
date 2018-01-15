/**
 * External dependencies
 */
import jQuery from 'jquery';

/**
 * Internal dependencies
 */
import { insertHtml } from '../store/actions';

const shimpMediaEditor = ( store ) => {
	jQuery( document ).ready( () => {
		wp.media.editor.insert = ( content ) => {
			store.dispatch( insertHtml( content ) );
		};
	} );
};

export default shimpMediaEditor;
