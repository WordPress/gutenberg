/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { Slot, Fill, withContext } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import './style.scss';
import EditorScreenTakeover from './editor-screen-takeover';

/**
 * Name of slot in which the screen takeover should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginScreenTakeover';

let PluginScreenTakeover = ( { pluginName, name, icon, children } ) => (
	<Fill name={ [ SLOT_NAME, pluginName, name ].join( '/' ) }>
		<EditorScreenTakeover
			icon={ icon }
			title={ 'Screen Takeover Title' }
		>
			{ children }
		</EditorScreenTakeover>
	</Fill>
);

PluginScreenTakeover = compose( [
	withContext( 'pluginName' )(),
] )( PluginScreenTakeover );

PluginScreenTakeover.Slot = withSelect( select => ( {
	activeScreenTakeoverName: select( 'core/edit-post' ).getActiveScreenTakeoverName(),
} ) )( PluginScreenTakeover.Slot );

export default PluginScreenTakeover;
