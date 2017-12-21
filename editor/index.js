/**
 * External dependencies
 */
import moment from 'moment-timezone';
import 'moment-timezone/moment-timezone-utils';
import { AppContainer } from 'react-hot-loader';

/**
 * WordPress dependencies
 */
import { render as elRender, unmountComponentAtNode } from '@wordpress/element';
import { settings as dateSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import './assets/stylesheets/main.scss';
import { initializeMetaBoxState } from './store/actions';
import Editor from './components/editor';

export * from './components';
import store from './store'; // Registers the state tree

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

const render = ( Component, props, target ) => {
	elRender(
		<AppContainer>
			<Component { ...props } />
		</AppContainer>,
		target
	);
};

/**
 * Reinitializes the editor after the user chooses to reboot the editor after
 * an unhandled error occurs, replacing previously mounted editor element using
 * an initial state from prior to the crash.
 *
 * @param {Element} target       DOM node in which editor is rendered
 * @param {?Object} settings     Editor settings object
 */
export function recreateEditorInstance( target, settings ) {
	unmountComponentAtNode( target );

	const reboot = recreateEditorInstance.bind( null, target, settings );

	render(
		Editor,
		{
			settings: settings,
			onError: reboot,
			recovery: true,
		},
		target
	);
}

/**
 * Initializes and returns an instance of Editor.
 *
 * The return value of this function is not necessary if we change where we
 * call createEditorInstance(). This is due to metaBox timing.
 *
 * @param  {String}  id       Unique identifier for editor instance
 * @param  {Object}  post     API entity for post to edit
 * @param  {?Object} settings Editor settings object
 * @return {Object}           Editor interface
 */
export function createEditorInstance( id, post, settings ) {
	const target = document.getElementById( id );
	const reboot = recreateEditorInstance.bind( null, target, settings );

	const props = {
		settings: settings,
		post: post,
		onError: reboot,
	};

	render( Editor, props, target );

	if ( module.hot ) {
		module.hot.accept( './components/editor', () => {
			render( Editor, props, target );
		} );
	}

	return {
		initializeMetaBoxes( metaBoxes ) {
			store.dispatch( initializeMetaBoxState( metaBoxes ) );
		},
	};
}
