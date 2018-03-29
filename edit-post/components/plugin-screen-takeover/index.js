/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { Slot, Fill, withContext } from '@wordpress/components';

/**
 * Name of slot in which the screen takeover should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginScreenTakeover';

let PluginScreenTakeover = ( { pluginName, name, children } ) => (
	<Fill name={ [ SLOT_NAME, pluginName, name ].join( '/' ) }>
		{ children }
	</Fill>
);

PluginScreenTakeover = compose( [
	withContext( 'pluginName' )(),
] )( PluginScreenTakeover );

PluginScreenTakeover.Slot = ( { name } ) => (
	<Slot name={ [ SLOT_NAME, name ].join( '/' ) } />
);

export default PluginScreenTakeover;
