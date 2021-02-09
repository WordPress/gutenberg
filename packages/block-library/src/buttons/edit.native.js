/**
 * External dependencies
 */
import { debounce } from 'lodash';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { BlockControls, InnerBlocks } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useResizeObserver } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import {
	ToolbarGroup,
	ToolbarItem,
	alignmentHelpers,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';
import styles from './editor.scss';
import ContentJustificationDropdown from './content-justification-dropdown';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];

const layoutProp = { type: 'default', alignments: [] };

export default function ButtonsEdit( {
	attributes: { contentJustification, align },
	clientId,
	isSelected,
	setAttributes,
	blockWidth,
} ) {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const [ maxWidth, setMaxWidth ] = useState( 0 );
	const { marginLeft: spacing } = styles.spacing;

	const { getBlockOrder, isInnerButtonSelected, shouldDelete } = useSelect(
		( select ) => {
			const {
				getBlockCount,
				getBlockOrder: _getBlockOrder,
				getBlockParents,
				getSelectedBlockClientId,
			} = select( 'core/block-editor' );
			const selectedBlockClientId = getSelectedBlockClientId();
			const selectedBlockParents = getBlockParents(
				selectedBlockClientId,
				true
			);

			return {
				getBlockOrder: _getBlockOrder,
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

	const { insertBlock, removeBlock, selectBlock } = useDispatch(
		'core/block-editor'
	);

	useEffect( () => {
		const margins = 2 * styles.parent.marginRight;
		const { width } = sizes || {};
		const { isFullWidth } = alignmentHelpers;

		if ( width ) {
			const base = width - margins;
			const isFullWidthBlock = isFullWidth( align );

			setMaxWidth( isFullWidthBlock ? base - 2 * spacing : base );
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

	function onChangeContentJustification( updatedValue ) {
		setAttributes( {
			contentJustification: updatedValue,
		} );
	}

	const renderFooterAppender = useRef( () => (
		<View style={ styles.appenderContainer }>
			<InnerBlocks.ButtonBlockAppender
				isFloating={ true }
				onAddBlock={ onAddNextButton }
			/>
		</View>
	) );

	const remove = useCallback( () => removeBlock( clientId ), [ clientId ] );
	const shouldRenderFooterAppender = isSelected || isInnerButtonSelected;
	return (
		<>
			{ isSelected && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarItem>
							{ ( toggleProps ) => (
								<ContentJustificationDropdown
									toggleProps={ toggleProps }
									value={ contentJustification }
									onChange={ onChangeContentJustification }
								/>
							) }
						</ToolbarItem>
					</ToolbarGroup>
				</BlockControls>
			) }
			{ resizeObserver }
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				template={ BUTTONS_TEMPLATE }
				renderFooterAppender={
					shouldRenderFooterAppender && renderFooterAppender.current
				}
				orientation="horizontal"
				horizontalAlignment={ contentJustification }
				onDeleteBlock={ shouldDelete ? remove : undefined }
				onAddBlock={ onAddNextButton }
				parentWidth={ maxWidth }
				marginHorizontal={ spacing }
				marginVertical={ spacing }
				__experimentalLayout={ layoutProp }
				templateInsertUpdatesSelection
				blockWidth={ blockWidth }
			/>
		</>
	);
}
