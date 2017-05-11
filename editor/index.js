/**
 * External dependencies
 */
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as SlotFillProvider } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { render } from 'element';
import { parse } from 'blocks';

/**
 * Internal dependencies
 */
import './assets/stylesheets/main.scss';
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
		type: 'RESET_BLOCKS',
		post,
		blocks: parse( post.content.raw )
	} );

	render(
		<ReduxProvider store={ store }>
			<SlotFillProvider>
				<Layout />
			</SlotFillProvider>
		</ReduxProvider>,
		document.getElementById( id )
	);
}
