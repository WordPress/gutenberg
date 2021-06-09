/**
 * External dependencies
 */
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { State, LongPressGestureHandler } from 'react-native-gesture-handler';

/**
 * WordPress dependencies
 */
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { useContext, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockMover from '../block-mover';
import BlockActionsMenu from './block-actions-menu';
import { BlockSettingsButton } from '../block-settings';
import { store as blockEditorStore } from '../../store';
import { DragContext } from '../block-list/block-list-item';

// Defined breakpoints are used to get a point when
// `settings` and `mover` controls should be wrapped into `BlockActionsMenu`
// and accessed through `BottomSheet`(Android)/`ActionSheet`(iOS).
const BREAKPOINTS = {
	wrapSettings: 65,
	wrapMover: 150,
};
const BlockMobileToolbar = ( {
	clientId,
	onDelete,
	isStackedHorizontally,
	blockWidth,
	anchorNodeRef,
	isFullWidth,
} ) => {
	const { dragHandler } = useContext( DragContext );
	const [ fillsLength, setFillsLength ] = useState( null );
	const [ appenderWidth, setAppenderWidth ] = useState( 0 );
	const spacingValue = styles.toolbar.marginLeft * 2;

	function onLayout( { nativeEvent } ) {
		const { layout } = nativeEvent;
		const layoutWidth = Math.floor( layout.width );
		if ( layoutWidth !== appenderWidth ) {
			setAppenderWidth( nativeEvent.layout.width );
		}
	}

	const wrapBlockSettings =
		blockWidth < BREAKPOINTS.wrapSettings ||
		appenderWidth - spacingValue < BREAKPOINTS.wrapSettings;
	const wrapBlockMover =
		blockWidth <= BREAKPOINTS.wrapMover ||
		appenderWidth - spacingValue <= BREAKPOINTS.wrapMover;

	return (
		<LongPressGestureHandler
			onHandlerStateChange={ dragHandler }
			shouldCancelWhenOutside={ false }
			// This was also needed, otherwise the event ended immediately
			maxDist={ 1000 }
		>
			{ /* This was needed for some reason, otherwise the handler was erroring
					 with an object instead of a function */ }
			<Animated.View>
				<View
					style={ [
						styles.toolbar,
						isFullWidth && styles.toolbarFullWidth,
					] }
					onLayout={ onLayout }
				>
					{ ! wrapBlockMover && (
						<BlockMover
							clientIds={ [ clientId ] }
							isStackedHorizontally={ isStackedHorizontally }
						/>
					) }

					<View style={ styles.spacer } />

					<BlockSettingsButton.Slot>
						{ /* Render only one settings icon even if we have more than one fill - need for hooks with controls */ }
						{ ( fills = [ null ] ) => {
							setFillsLength( fills.length );
							return wrapBlockSettings ? null : fills[ 0 ];
						} }
					</BlockSettingsButton.Slot>

					<BlockActionsMenu
						clientIds={ [ clientId ] }
						wrapBlockMover={ wrapBlockMover }
						wrapBlockSettings={ wrapBlockSettings && fillsLength }
						isStackedHorizontally={ isStackedHorizontally }
						onDelete={ onDelete }
						anchorNodeRef={ anchorNodeRef }
					/>
				</View>
			</Animated.View>
		</LongPressGestureHandler>
	);
};

export default compose(
	withSelect( ( select, { clientId } ) => {
		const { getBlockIndex } = select( blockEditorStore );

		return {
			order: getBlockIndex( clientId ),
		};
	} ),
	withDispatch( ( dispatch, { clientId, rootClientId, onDelete } ) => {
		const { removeBlock } = dispatch( blockEditorStore );
		return {
			onDelete:
				onDelete || ( () => removeBlock( clientId, rootClientId ) ),
		};
	} )
)( BlockMobileToolbar );
