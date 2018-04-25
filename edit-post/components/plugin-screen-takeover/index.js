/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */
/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { Slot, Fill } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { withPluginContext } from '@wordpress/plugins';
import ScreenTakeoverHeader from './screen-takeover-header';

/**
 * Name of slot in which the screen takeover should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginScreenTakeover';

/**
 * Creates the plugin screen takeover component, which combines the screen takeover header and the content.
 *
 * @param { Object }     pluginContext   The pluginContext provided by withPluginContext.
 * @param { string }     name            The plugin's identifier.
 * @param { string }     title           The title for the screen takeover.
 * @param { SVGElement } icon            An SVG icon to be displayed in the screen takeover header.
 * @param {*} children                   The content to be rendered in the screen takeover.
 *
 * @return {*} The plugin screen takeover.
 */
let PluginScreenTakeover = ( { pluginContext, name, title, icon, children } ) => {
	if ( title === undefined ) {
		console.error( 'PluginScreenTakeover must have a title.' );
	}
	return (
		<Fill name={ [ SLOT_NAME, pluginContext.name, name ].join( '/' ) }>
			<ScreenTakeoverHeader title={ title } icon={ icon } />
			{ children }
		</Fill>
	);
};

PluginScreenTakeover = compose( [
	withPluginContext,
	withDispatch( ( dispatch ) => ( {
		onClose: dispatch( 'core/edit-post' ).closeScreenTakeover,
	} ) ),
	withSelect( ( select ) => {
		return {
			activeScreenTakeoverName: select( 'core/edit-post' ).getActiveScreenTakeoverName(),
		};
	} ),
] )( PluginScreenTakeover );

PluginScreenTakeover.Slot = ( { activeScreenTakeoverName } ) => {
	return <Slot name={ [ SLOT_NAME, activeScreenTakeoverName ].join( '/' ) } />;
};

PluginScreenTakeover.Slot = withSelect( ( select ) => ( {
	activeScreenTakeoverName: select( 'core/edit-post' ).getActiveScreenTakeoverName(),
} ) )( PluginScreenTakeover.Slot );

export default PluginScreenTakeover;
