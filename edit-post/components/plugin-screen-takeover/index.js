/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { Slot, Fill } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { PluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import './style.scss';
import EditorScreenTakeover from './editor-screen-takeover';

/**
 * Name of slot in which the screen takeover should fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginScreenTakeover';

let PluginScreenTakeover = ( { name, icon, children, onClose, title } ) => (
	<PluginContext.Consumer>
		{ ( { pluginName } ) => {
			return (
				<Fill name={ [ SLOT_NAME, pluginName, name ].join( '/' ) }>
					<EditorScreenTakeover
						icon={ icon }
						title={ title }
						onClose={ onClose }
					>
						{ children }
					</EditorScreenTakeover>
				</Fill>
			);
		} }
	</PluginContext.Consumer>
);

PluginScreenTakeover = compose( [
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

PluginScreenTakeover.Slot = withSelect( select => ( {
	activeScreenTakeoverName: select( 'core/edit-post' ).getActiveScreenTakeoverName(),
} ) )( PluginScreenTakeover.Slot );

export default PluginScreenTakeover;
