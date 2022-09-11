/**
 * External dependencies
 */
import { Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Picker, ToolbarButton } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getMoversSetup } from './mover-description';
import { store as blockEditorStore } from '../../store';

export const BLOCK_MOVER_DIRECTION_TOP = 'blockPageMoverOptions-moveToTop';
export const BLOCK_MOVER_DIRECTION_BOTTOM =
	'blockPageMoverOptions-moveToBottom';

export const BlockMover = ( {
	isFirst,
	isLast,
	canMove,
	onMoveDown,
	onMoveUp,
	onLongMove,
	firstIndex,
	numberOfBlocks,
	rootClientId,
	isStackedHorizontally,
} ) => {
	const pickerRef = useRef();
	const [ shouldPresentPicker, setShouldPresentPicker ] = useState( false );
	const [ blockPageMoverState, setBlockPageMoverState ] =
		useState( undefined );
	const showBlockPageMover = ( direction ) => () => {
		if ( ! pickerRef.current ) {
			setBlockPageMoverState( undefined );
			return;
		}

		setBlockPageMoverState( direction );
		setShouldPresentPicker( true );
	};

	// Ensure that the picker is only presented after state updates.
	useEffect( () => {
		if ( shouldPresentPicker ) {
			pickerRef.current?.presentPicker();
			setShouldPresentPicker( false );
		}
	}, [ shouldPresentPicker ] );

	const {
		description: {
			backwardButtonHint,
			forwardButtonHint,
			firstBlockTitle,
			lastBlockTitle,
		},
		icon: { backward: backwardButtonIcon, forward: forwardButtonIcon },
		title: { backward: backwardButtonTitle, forward: forwardButtonTitle },
	} = getMoversSetup( isStackedHorizontally, { firstIndex } );

	const blockPageMoverOptions = [
		{
			icon: backwardButtonIcon,
			label: __( 'Move to top' ),
			value: BLOCK_MOVER_DIRECTION_TOP,
			onSelect: () => {
				onLongMove()( 0 );
			},
		},
		{
			icon: forwardButtonIcon,
			label: __( 'Move to bottom' ),
			value: BLOCK_MOVER_DIRECTION_BOTTOM,
			onSelect: () => {
				onLongMove()( numberOfBlocks );
			},
		},
	].filter( ( el ) => el.value === blockPageMoverState );

	const onPickerSelect = ( value ) => {
		const option = blockPageMoverOptions.find(
			( el ) => el.value === value
		);
		if ( option && option.onSelect ) option.onSelect();
	};

	const onLongPressMoveUp = useCallback(
		showBlockPageMover( BLOCK_MOVER_DIRECTION_TOP ),
		[]
	);
	const onLongPressMoveDown = useCallback(
		showBlockPageMover( BLOCK_MOVER_DIRECTION_BOTTOM ),
		[]
	);

	if ( ! canMove || ( isFirst && isLast && ! rootClientId ) ) {
		return null;
	}

	return (
		<>
			<ToolbarButton
				title={ ! isFirst ? backwardButtonTitle : firstBlockTitle }
				isDisabled={ isFirst }
				onClick={ onMoveUp }
				onLongPress={ onLongPressMoveUp }
				icon={ backwardButtonIcon }
				extraProps={ { hint: backwardButtonHint } }
			/>

			<ToolbarButton
				title={ ! isLast ? forwardButtonTitle : lastBlockTitle }
				isDisabled={ isLast }
				onClick={ onMoveDown }
				onLongPress={ onLongPressMoveDown }
				icon={ forwardButtonIcon }
				extraProps={ {
					hint: forwardButtonHint,
				} }
			/>

			<Picker
				ref={ pickerRef }
				options={ blockPageMoverOptions }
				onChange={ onPickerSelect }
				title={ __( 'Change block position' ) }
				leftAlign={ true }
				hideCancelButton={ Platform.OS !== 'ios' }
			/>
		</>
	);
};

export default compose(
	withSelect( ( select, { clientIds } ) => {
		const {
			getBlockIndex,
			canMoveBlocks,
			getBlockRootClientId,
			getBlockOrder,
		} = select( blockEditorStore );
		const normalizedClientIds = Array.isArray( clientIds )
			? clientIds
			: [ clientIds ];
		const firstClientId = normalizedClientIds[ 0 ];
		const rootClientId = getBlockRootClientId( firstClientId );
		const blockOrder = getBlockOrder( rootClientId );
		const firstIndex = getBlockIndex( firstClientId );
		const lastIndex = getBlockIndex(
			normalizedClientIds[ normalizedClientIds.length - 1 ]
		);

		return {
			firstIndex,
			numberOfBlocks: blockOrder.length - 1,
			isFirst: firstIndex === 0,
			isLast: lastIndex === blockOrder.length - 1,
			canMove: canMoveBlocks( clientIds, rootClientId ),
			rootClientId,
		};
	} ),
	withDispatch( ( dispatch, { clientIds, rootClientId } ) => {
		const { moveBlocksDown, moveBlocksUp, moveBlocksToPosition } =
			dispatch( blockEditorStore );
		return {
			onMoveDown: ( ...args ) =>
				moveBlocksDown( clientIds, rootClientId, ...args ),
			onMoveUp: ( ...args ) =>
				moveBlocksUp( clientIds, rootClientId, ...args ),
			onLongMove:
				( targetIndex ) =>
				( ...args ) =>
					moveBlocksToPosition(
						clientIds,
						rootClientId,
						targetIndex,
						...args
					),
		};
	} ),
	withInstanceId
)( BlockMover );
