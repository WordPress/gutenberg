/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { Slot, Fill, withContext } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';

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
	// withDispatch( ( dispatch, ownProps ) => {
	// 	console.log( ownProps );
	// 	return {
	// 		onClose: dispatch( 'core/edit-post' ).closeScreenTakover,
	// 	};
	// } ),
	// withSelect( ( select, ownProps ) => {
	// 	const { name } = ownProps;
	// 	return {
	// 		isOpen: select( 'core/edit-post' ).getActiveScreenTakeoverName() === name,
	// 	};
	// } ),
] )( PluginScreenTakeover );

PluginScreenTakeover.Slot = withSelect( select => ( {
	activeScreenTakeoverName: select( 'core/edit-post' ).getActiveScreenTakeoverName(),
} ) )( PluginScreenTakeover.Slot );

export default PluginScreenTakeover;
