/**
 * External dependencies
 */
import moment from 'moment-timezone';
import 'moment-timezone/moment-timezone-utils';

/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';
import { settings as dateSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import './assets/stylesheets/main.scss';
import Layout from './layout';
import EditorProvider from './provider';

// Configure moment globally
moment.locale( dateSettings.l10n.locale );
if ( dateSettings.timezone.string ) {
	moment.tz.setDefault( dateSettings.timezone.string );
} else {
	const momentTimezone = {
		name: 'WP',
		abbrs: [ 'WP' ],
		untils: [ null ],
		offsets: [ -dateSettings.timezone.offset * 60 ],
	};
	const unpackedTimezone = moment.tz.pack( momentTimezone );
	moment.tz.add( unpackedTimezone );
	moment.tz.setDefault( 'WP' );
}

/**
 * Configure heartbeat to refresh the wp-api nonce, keeping the editor authorization intact.
 */
window.jQuery( document ).on( 'heartbeat-tick', ( event, response ) => {
	if ( response[ 'rest-nonce' ] ) {
		window.wpApiSettings.nonce = response[ 'rest-nonce' ];
	}
} );

/**
 * Initializes and returns an instance of Editor.
 *
 * @param {String}  id       Unique identifier for editor instance
 * @param {Object}  post     API entity for post to edit
 * @param {?Object} settings Editor settings object
 */
export function createEditorInstance( id, post, settings ) {
	const target = document.getElementById( id );

	render(
		<EditorProvider settings={ settings } post={ post } target={ target }>
			<Layout />
		</EditorProvider>,
		target
	);
}
