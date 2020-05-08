/**
 * External dependencies
 */
import { Keyboard, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockMover from '../block-mover';
import BlockActionsMenu from './block-actions-menu';
import { BlockSettingsButton } from '../block-settings';

const BlockMobileToolbar = ( {
	clientId,
	onDelete,
	isStackedHorizontally,
	blockWidth,
} ) => {
	const shouldWrapBlockSettings = blockWidth < 65;
	const shouldWrapBlockMover = blockWidth <= 150;

	return (
		<View style={ styles.toolbar }>
			{ ! shouldWrapBlockMover && (
				<BlockMover
					clientIds={ [ clientId ] }
					isStackedHorizontally={ isStackedHorizontally }
				/>
			) }

			<View style={ styles.spacer } />

			{ ! shouldWrapBlockSettings && <BlockSettingsButton.Slot /> }

			<BlockActionsMenu
				clientIds={ [ clientId ] }
				shouldWrapBlockMover={ shouldWrapBlockMover }
				shouldWrapBlockSettings={ shouldWrapBlockSettings }
				isStackedHorizontally={ isStackedHorizontally }
				onDelete={ onDelete }
			/>
		</View>
	);
};

export default compose(
	withSelect( ( select, { clientId } ) => {
		const { getBlockIndex } = select( 'core/block-editor' );

		return {
			order: getBlockIndex( clientId ),
		};
	} ),
	withDispatch( ( dispatch, { clientId, rootClientId, onDelete } ) => {
		const { removeBlock } = dispatch( 'core/block-editor' );
		return {
			onDelete:
				onDelete ||
				( () => {
					Keyboard.dismiss();
					removeBlock( clientId, rootClientId );
				} ),
		};
	} )
)( BlockMobileToolbar );
