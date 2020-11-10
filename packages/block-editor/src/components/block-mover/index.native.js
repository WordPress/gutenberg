/**
 * External dependencies
 */
import { first, last, partial, castArray } from 'lodash';
import React, { useRef, useState } from 'react';
import { Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Picker, ToolbarButton } from '@wordpress/components';
import { withInstanceId, compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getMoversSetup } from './mover-description';

const DIRECTION_TOP = 'blockPageMoverOptions-moveToTop';
const DIRECTION_BOTTOM = 'blockPageMoverOptions-moveToBottom';

const BlockMover = ( {
	isFirst,
	isLast,
	isLocked,
	onMoveDown,
	onMoveUp,
	onLongMove,
	firstIndex,
	numberOfBlocks,
	rootClientId,
	isStackedHorizontally,
} ) => {
	const pickerRef = useRef();
	const [ blockPageMoverState, setBlockPageMoverState ] = useState(
		undefined
	);
	const showBlockPageMover = ( direction ) => () => {
		if ( ! pickerRef.current ) {
			setBlockPageMoverState( undefined );
			return;
		}

		setBlockPageMoverState( direction );
		pickerRef.current.presentPicker();
	};

	const blockPageMoverOptions = [
		{
			label: __( 'Move to top' ),
			value: DIRECTION_TOP,
			onSelect: () => {
				onLongMove()( 0 );
			},
		},
		{
			label: __( 'Move to bottom' ),
			value: DIRECTION_BOTTOM,
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

	if ( isLocked || ( isFirst && isLast && ! rootClientId ) ) {
		return null;
	}

	return (
		<>
			<ToolbarButton
				title={ ! isFirst ? backwardButtonTitle : firstBlockTitle }
				isDisabled={ isFirst }
				onClick={ onMoveUp }
				onLongPress={ showBlockPageMover( DIRECTION_TOP ) }
				icon={ backwardButtonIcon }
				extraProps={ { hint: backwardButtonHint } }
			/>

			<ToolbarButton
				title={ ! isLast ? forwardButtonTitle : lastBlockTitle }
				isDisabled={ isLast }
				onClick={ onMoveDown }
				onLongPress={ showBlockPageMover( DIRECTION_BOTTOM ) }
				icon={ forwardButtonIcon }
				extraProps={ {
					hint: forwardButtonHint,
				} }
			/>

			<Picker
				ref={ pickerRef }
				options={ blockPageMoverOptions }
				onChange={ onPickerSelect }
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
			getTemplateLock,
			getBlockRootClientId,
			getBlockOrder,
		} = select( 'core/block-editor' );
		const normalizedClientIds = castArray( clientIds );
		const firstClientId = first( normalizedClientIds );
		const rootClientId = getBlockRootClientId( firstClientId );
		const blockOrder = getBlockOrder( rootClientId );
		const firstIndex = getBlockIndex( firstClientId, rootClientId );
		const lastIndex = getBlockIndex(
			last( normalizedClientIds ),
			rootClientId
		);

		return {
			firstIndex,
			numberOfBlocks: blockOrder.length - 1,
			isFirst: firstIndex === 0,
			isLast: lastIndex === blockOrder.length - 1,
			isLocked: getTemplateLock( rootClientId ) === 'all',
			rootClientId,
		};
	} ),
	withDispatch( ( dispatch, { clientIds, rootClientId } ) => {
		const { moveBlocksDown, moveBlocksUp, moveBlocksToPosition } = dispatch(
			'core/block-editor'
		);
		return {
			onMoveDown: partial( moveBlocksDown, clientIds, rootClientId ),
			onMoveUp: partial( moveBlocksUp, clientIds, rootClientId ),
			onLongMove: ( targetIndex ) =>
				partial(
					moveBlocksToPosition,
					clientIds,
					rootClientId,
					targetIndex
				),
		};
	} ),
	withInstanceId
)( BlockMover );
