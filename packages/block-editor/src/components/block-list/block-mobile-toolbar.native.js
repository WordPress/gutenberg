/**
 * External dependencies
 */
import { Keyboard, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './block-mobile-toolbar.scss';
import BlockMover from '../block-mover';
import InspectorControls from '../inspector-controls';

const BlockMobileToolbar = ( {
	clientId,
	onDelete,
} ) => (
	<View style={ styles.toolbar }>
		<BlockMover clientIds={ [ clientId ] } />

		<View style={ styles.spacer } />

		<InspectorControls.Slot />

		<ToolbarButton
			label={ __( 'Remove' ) }
			onClick={ onDelete }
			icon="trash"
		/>
	</View>
);

export default compose(
	withDispatch( ( dispatch, { clientId, rootClientId, onDelete } ) => {
		const { removeBlock } = dispatch( 'core/block-editor' );
		return {
			onDelete() {
				Keyboard.dismiss();
				removeBlock( clientId, rootClientId );
				if ( onDelete ) {
					onDelete( clientId );
				}
			},
		};
	} ),
)( BlockMobileToolbar );
