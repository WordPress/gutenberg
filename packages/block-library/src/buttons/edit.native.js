/**
 * External dependencies
 */
import { debounce } from 'lodash';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	BlockControls,
	InnerBlocks,
	JustifyContentControl,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock, getBlockSupport } from '@wordpress/blocks';
import { useResizeObserver } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { alignmentHelpers } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';
import styles from './editor.scss';

const ALLOWED_BLOCKS = [ buttonBlockName ];

const layoutProp = { type: 'default', alignments: [] };

export default function ButtonsEdit( {
	attributes: { layout, align },
	clientId,
	isSelected,
	setAttributes,
	blockWidth,
	name,
} ) {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const [ maxWidth, setMaxWidth ] = useState( 0 );
	const { marginLeft: spacing } = styles.spacing;

	// Extract attributes from block layout
	const layoutBlockSupport = getBlockSupport( name, '__experimentalLayout' );
	const defaultBlockLayout = layoutBlockSupport?.default;
	const usedLayout = layout || defaultBlockLayout || {};
	const { justifyContent } = usedLayout;

	const { isInnerButtonSelected, shouldDelete } = useSelect(
		( select ) => {
			const {
				getBlockCount,
				getBlockParents,
				getSelectedBlockClientId,
			} = select( blockEditorStore );
			const selectedBlockClientId = getSelectedBlockClientId();
			const selectedBlockParents = getBlockParents(
				selectedBlockClientId,
				true
			);

			return {
				isInnerButtonSelected: selectedBlockParents[ 0 ] === clientId,
				// The purpose of `shouldDelete` check is giving the ability to
				// pass to mobile toolbar function called `onDelete` which removes
				// the whole `Buttons` container along with the last inner button
				// when there is exactly one button.
				shouldDelete: getBlockCount( clientId ) === 1,
			};
		},
		[ clientId ]
	);

	const preferredStyle = useSelect( ( select ) => {
		const preferredStyleVariations = select(
			blockEditorStore
		).getSettings().__experimentalPreferredStyleVariations;
		return preferredStyleVariations?.value?.[ buttonBlockName ];
	}, [] );

	const { getBlockOrder } = useSelect( blockEditorStore );
	const { insertBlock, removeBlock, selectBlock } = useDispatch(
		blockEditorStore
	);

	useEffect( () => {
		const { width } = sizes || {};
		const { isFullWidth } = alignmentHelpers;

		if ( width ) {
			const isFullWidthBlock = isFullWidth( align );
			setMaxWidth( isFullWidthBlock ? blockWidth : width );
		}
	}, [ sizes, align ] );

	const onAddNextButton = useCallback(
		debounce( ( selectedId ) => {
			const order = getBlockOrder( clientId );
			const selectedButtonIndex = order.findIndex(
				( i ) => i === selectedId
			);

			const index =
				selectedButtonIndex === -1
					? order.length + 1
					: selectedButtonIndex;

			const insertedBlock = createBlock( 'core/button' );

			insertBlock( insertedBlock, index, clientId );
			selectBlock( insertedBlock.clientId );
		}, 200 ),
		[]
	);

	const renderFooterAppender = useRef( () => (
		<View style={ styles.appenderContainer }>
			<InnerBlocks.ButtonBlockAppender
				isFloating={ true }
				onAddBlock={ onAddNextButton }
			/>
		</View>
	) );

	const justifyControls = [ 'left', 'center', 'right' ];

	const remove = useCallback( () => removeBlock( clientId ), [ clientId ] );
	const shouldRenderFooterAppender = isSelected || isInnerButtonSelected;
	return (
		<>
			{ isSelected && (
				<BlockControls group="block">
					<JustifyContentControl
						allowedControls={ justifyControls }
						value={ justifyContent }
						onChange={ ( value ) =>
							setAttributes( {
								layout: {
									...usedLayout,
									justifyContent: value,
								},
							} )
						}
						popoverProps={ {
							position: 'bottom right',
							isAlternate: true,
						} }
					/>
				</BlockControls>
			) }
			{ resizeObserver }
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				template={ [
					[
						buttonBlockName,
						{
							className:
								preferredStyle &&
								`is-style-${ preferredStyle }`,
						},
					],
				] }
				renderFooterAppender={
					shouldRenderFooterAppender && renderFooterAppender.current
				}
				orientation="horizontal"
				horizontalAlignment={ justifyContent }
				onDeleteBlock={ shouldDelete ? remove : undefined }
				onAddBlock={ onAddNextButton }
				parentWidth={ maxWidth } // This value controls the width of that the buttons are able to expand to.
				marginHorizontal={ spacing }
				marginVertical={ spacing }
				__experimentalLayout={ layoutProp }
				templateInsertUpdatesSelection
				blockWidth={ blockWidth }
			/>
		</>
	);
}
