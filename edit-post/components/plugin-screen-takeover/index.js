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

let PluginScreenTakeover = ( { pluginName, name, icon, children, isOpen, onClose } ) => (
	<Fill name={ [ SLOT_NAME, pluginName, name ].join( '/' ) }>
		<EditorScreenTakeover
			icon={ icon }
			title={ 'Screen Takeover Title' }
			isOpen={ isOpen }
			onClose={ onClose }
		>
			{ children }
		</EditorScreenTakeover>
	</Fill>
);

PluginScreenTakeover = compose( [
	withContext( 'pluginName' )(),
	withDispatch( ( dispatch ) => ( {
		onClose: dispatch( 'core/edit-post' ).closeScreenTakeover,
	} ) ),
	withSelect( ( select, ownProps ) => {
		const { name, pluginName } = ownProps;
		return {
			isOpen: select( 'core/edit-post' ).getActiveScreenTakeoverName() === `${ pluginName }/${ name }`,
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
