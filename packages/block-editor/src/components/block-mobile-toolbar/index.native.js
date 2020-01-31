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

const BlockMobileToolbar = ( { clientId, onDelete, order } ) => (
	<View style={ styles.toolbar }>
		<BlockMover clientIds={ [ clientId ] } />

		<View style={ styles.spacer } />

		<BlockSettingsButton.Slot />

		<ToolbarButton
			title={ sprintf(
				/* translators: accessibility text. %s: current block position (number). */
				__( 'Remove block at row %s' ),
				order + 1
			) }
			onClick={ onDelete }
			icon={ trash }
			extraProps={ { hint: __( 'Double tap to remove the block' ) } }
		/>
	</View>
);

export default compose(
	withSelect( ( select, { clientId } ) => {
		const { getBlockIndex } = select( 'core/block-editor' );

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
	} )
)( BlockMobileToolbar );
