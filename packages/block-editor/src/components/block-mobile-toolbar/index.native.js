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
import { trash } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockMover from '../block-mover';
import { BlockSettingsButton } from '../block-settings';

const BlockMobileToolbar = ( {
	clientId,
	onDelete,
	order,
	customOnDelete,
	horizontalDirection,
} ) => (
	<View style={ styles.toolbar }>
		<BlockMover
			clientIds={ [ clientId ] }
			horizontalDirection={ horizontalDirection }
		/>

		<View style={ styles.spacer } />

		<BlockSettingsButton.Slot />

		<ToolbarButton
			title={ sprintf(
				/* translators: accessibility text. %s: current block position (number). */
				__( 'Remove block at row %s' ),
				order + 1
			) }
			onClick={ customOnDelete || onDelete }
			icon={ trash }
			extraProps={ { hint: __( 'Double tap to remove the block' ) } }
		/>
	</View>
);

export default compose(
	withSelect( ( select, { clientId } ) => {
		const { getBlockIndex, getBlockRootClientId } = select(
			'core/block-editor'
		);

		return {
			order: getBlockIndex( clientId ),
			rootClientId: getBlockRootClientId( clientId ),
		};
	} ),
	withDispatch( ( dispatch, { clientId, rootClientId } ) => {
		const { removeBlock, selectBlock } = dispatch( 'core/block-editor' );
		return {
			onDelete: () => {
				Keyboard.dismiss();
				removeBlock( clientId, rootClientId );
				if ( !! rootClientId ) {
					selectBlock( rootClientId );
				}
			},
		};
	} )
)( BlockMobileToolbar );
