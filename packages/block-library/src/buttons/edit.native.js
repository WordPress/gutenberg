/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	BlockControls,
	AlignmentToolbar,
} from '@wordpress/block-editor';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';
import styles from './editor.scss';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];
const ALIGNMENT_MAP = {
	left: 'flex-start',
	center: 'center',
	right: 'flex-end',
};

function ButtonsEdit( {
	isSelected,
	attributes,
	setAttributes,
	onDelete,
	onAddNextButton,
	shouldDelete,
	isSelectedButton,
} ) {
	const { align } = attributes;
	const [ maxWidth, setMaxWidth ] = useState( 0 );
	const shouldRenderFooterAppender = isSelected || isSelectedButton;

	function updateAlignment( nextAlign ) {
		setAttributes( { align: nextAlign } );
	}

	function renderAppender() {
		if ( shouldRenderFooterAppender ) {
			return (
				<View style={ styles.appenderContainer }>
					<InnerBlocks.ButtonBlockAppender
						flex={ false }
						customOnAdd={ onAddNextButton }
					/>
				</View>
			);
		}
		return null;
	}

	function onLayout( { nativeEvent } ) {
		const { width } = nativeEvent.layout;
		const parentWidth = width + 4 * styles.buttonsContainer.marginLeft;

		setMaxWidth( parentWidth );
	}

	const buttonsStyle = {
		justifyContent: ALIGNMENT_MAP[ align ],
	};

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					isCollapsed={ false }
					value={ align }
					onChange={ updateAlignment }
				/>
			</BlockControls>
			<View onLayout={ onLayout } style={ styles.buttonsContainer }>
				<InnerBlocks
					allowedBlocks={ ALLOWED_BLOCKS }
					template={ BUTTONS_TEMPLATE }
					renderAppender={ renderAppender }
					__experimentalMoverDirection="horizontal"
					style={ buttonsStyle }
					customOnDelete={ shouldDelete && onDelete }
					customOnAdd={ onAddNextButton }
					parentWidth={ maxWidth }
					blockStyle={ styles.buttonBlock }
					shouldRenderFooterAppender={ shouldRenderFooterAppender }
				/>
			</View>
		</>
	);
}

export default compose(
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockCount,
			getBlockParents,
			getSelectedBlockClientId,
		} = select( 'core/block-editor' );
		const selectedBlockClientId = getSelectedBlockClientId();
		const buttonsParents = getBlockParents( clientId, true );
		const parentId = buttonsParents[ 0 ] || '';
		const selectedButtonParents = getBlockParents(
			selectedBlockClientId,
			true
		);
		const selectedButtonParentId = selectedButtonParents[ 0 ] || '';

		return {
			// The purpose of `shouldDelete` check is giving the ability to pass to
			// mobile toolbar function called `onDelete` which removes the whole
			// `Buttons` container along with the last inner button when
			// there is exactly one button.
			shouldDelete: getBlockCount( clientId ) === 1,
			isParentSelected:
				selectedBlockClientId && selectedBlockClientId === parentId,
			isSelectedButton: selectedButtonParentId === clientId,
		};
	} ),
	withDispatch( ( dispatch, { clientId }, registry ) => {
		const { replaceInnerBlocks, selectBlock, removeBlock } = dispatch(
			'core/block-editor'
		);
		const { getBlocks, getBlockOrder } = registry.select(
			'core/block-editor'
		);
		const innerBlocks = getBlocks( clientId );

		return {
			// The purpose of `onAddNextButton` is giving the ability to automatically
			// adding `Button` inside `Buttons` block on the appender press event.
			onAddNextButton: ( selectedId ) => {
				const order = getBlockOrder( clientId );
				const selectedButtonIndex = order.findIndex(
					( i ) => i === selectedId
				);

				const index =
					selectedButtonIndex === -1
						? order.length + 1
						: selectedButtonIndex;

				const insertedBlock = createBlock( 'core/button' );

				innerBlocks.splice( index + 1, 0, insertedBlock );

				replaceInnerBlocks( clientId, innerBlocks, true );
				selectBlock( insertedBlock.clientId );
			},
			onDelete: () => {
				removeBlock( clientId );
			},
		};
	} )
)( ButtonsEdit );
