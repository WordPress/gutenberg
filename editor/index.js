/**
 * External dependencies
 */
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as SlotFillProvider } from 'react-slot-fill';
import moment from 'moment-timezone';
import 'moment-timezone/moment-timezone-utils';

/**
 * WordPress dependencies
 */
import { parse } from 'blocks';
import { render } from 'element';
import { settings } from 'date';

/**
 * Internal dependencies
 */
import './assets/stylesheets/main.scss';
import Layout from './layout';
import { createReduxStore } from './state';

// Configure moment globally
moment.locale( settings.l10n.locale );
if ( settings.timezone.string ) {
	moment.tz.setDefault( settings.timezone.string );
} else {
	const momentTimezone = {
		name: 'WP',
		abbrs: [ 'WP' ],
		untils: [ null ],
		offsets: [ -settings.timezone.offset * 60 ],
	};
	const unpackedTimezone = moment.tz.pack( momentTimezone );
	moment.tz.add( unpackedTimezone );
	moment.tz.setDefault( 'WP' );
}

/**
 * Initializes Redux state with bootstrapped post, if provided.
 *
 * @param {Redux.Store} store Redux store instance
 * @param {Object}     post  Bootstrapped post object
 */
function preparePostState( store, post ) {
	// Set current post into state
	store.dispatch( {
		type: 'RESET_POST',
		post,
	} );

	// Parse content as blocks
	if ( post.content.raw ) {
		store.dispatch( {
			type: 'RESET_BLOCKS',
			blocks: parse( post.content.raw ),
		} );
	}

	// Include auto draft title in edits while not flagging post as dirty
	if ( post.status === 'auto-draft' ) {
		store.dispatch( {
			type: 'SETUP_NEW_POST',
			edits: {
				title: post.title.raw,
			},
		} );
	}
}

/**
 * Initializes and returns an instance of Editor.
 *
 * @param {String} id   Unique identifier for editor instance
 * @param {Object} post API entity for post to edit  (type required)
 */
export function createEditorInstance( id, post ) {
	const store = createReduxStore();

	store.dispatch( {
		type: 'LOAD_USER_DATA',
	} );

	preparePostState( store, post );

	render(
		<ReduxProvider store={ store }>
			<SlotFillProvider>
				<Layout />
			</SlotFillProvider>
		</ReduxProvider>,
		document.getElementById( id )
	);
}
