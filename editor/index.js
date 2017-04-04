/**
 * External dependencies
 */
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import './assets/stylesheets/main.scss';
import './blocks';
import Layout from './layout';
import { createReduxStore } from './state';

/**
 * Initializes and returns an instance of Editor.
 *
 * @param {String} id   Unique identifier for editor instance
 * @param {Object} post API entity for post to edit
 */
export function createEditorInstance( id, post ) {
	const store = createReduxStore();
	store.dispatch( {
		type: 'SET_HTML',
		html: post.content.raw
	} );

	wp.element.render(
		<Provider store={ store }>
			<Layout />
		</Provider>,
		document.getElementById( id )
	);
}
