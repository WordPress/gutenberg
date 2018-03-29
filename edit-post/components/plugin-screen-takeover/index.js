/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { Slot, Fill, withContext } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

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

PluginScreenTakeover.Slot = ( { activeScreenTakeoverName } ) => {
	return <Slot name={ [ SLOT_NAME, activeScreenTakeoverName ].join( '/' ) } />
};

PluginScreenTakeover.Slot = withSelect( select => ( {
	activeScreenTakeoverName: select( 'core/edit-post' ).getActiveScreenTakeoverName(),
} ) )( PluginScreenTakeover.Slot );

export default PluginScreenTakeover;
