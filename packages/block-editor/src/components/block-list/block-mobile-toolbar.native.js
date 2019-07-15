/**
 * External dependencies
 */
import { Keyboard, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
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
	order,
} ) => (
	<View style={ styles.toolbar }>
		<BlockMover clientIds={ [ clientId ] } />

		<View style={ styles.spacer } />

		<InspectorControls.Slot />

		<ToolbarButton
			title={
				sprintf(
					/* translators: accessibility text. %s: current block position (number). */
					__( 'Remove block at row %s' ),
					order + 1
				)
			}
			onClick={ onDelete }
			icon="trash"
			extraProps={ { hint: __( 'Double tap to remove the block' ) } }
		/>
	</View>
);

export default compose(
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockIndex,
		} = select( 'core/block-editor' );

		return {
			order: getBlockIndex( clientId ),
		};
	} ),
	withDispatch( ( dispatch, { clientId, rootClientId } ) => {
		const { removeBlock } = dispatch( 'core/block-editor' );
		return {
			onDelete: () => {
				Keyboard.dismiss();
				removeBlock( clientId, rootClientId );
			},
		};
	} ),
)( BlockMobileToolbar );
