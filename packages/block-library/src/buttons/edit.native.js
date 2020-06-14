/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	__experimentalAlignmentHookSettingsProvider as AlignmentHookSettingsProvider,
} from '@wordpress/block-editor';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, useResizeObserver } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';
import styles from './editor.scss';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];

function ButtonsEdit( {
	isSelected,
	onDelete,
	onAddNextButton,
	shouldDelete,
	isInnerButtonSelected,
} ) {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const [ maxWidth, setMaxWidth ] = useState( 0 );
	const shouldRenderFooterAppender = isSelected || isInnerButtonSelected;
	const { marginLeft: spacing } = styles.spacing;

	useEffect( () => {
		const margins = 2 * styles.parent.marginRight;
		const { width } = sizes || {};
		if ( width ) {
			setMaxWidth( width - margins );
		}
	}, [ sizes ] );

	const renderFooterAppender = useRef( () => (
		<View style={ styles.appenderContainer }>
			<InnerBlocks.ButtonBlockAppender
				isFloating={ true }
				onAddBlock={ onAddNextButton }
			/>
		</View>
	) );

	// Inside buttons block alignment options are not supported.
	const alignmentHooksSetting = {
		isEmbedButton: true,
	};

	return (
		<AlignmentHookSettingsProvider value={ alignmentHooksSetting }>
			{ resizeObserver }
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				template={ BUTTONS_TEMPLATE }
				renderFooterAppender={
					shouldRenderFooterAppender && renderFooterAppender.current
				}
				__experimentalMoverDirection="horizontal"
				onDeleteBlock={ shouldDelete ? onDelete : undefined }
				onAddBlock={ onAddNextButton }
				parentWidth={ maxWidth }
				marginHorizontal={ spacing }
				marginVertical={ spacing }
			/>
		</AlignmentHookSettingsProvider>
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
		const selectedBlockParents = getBlockParents(
			selectedBlockClientId,
			true
		);

		return {
			// The purpose of `shouldDelete` check is giving the ability to pass to
			// mobile toolbar function called `onDelete` which removes the whole
			// `Buttons` container along with the last inner button when
			// there is exactly one button.
			shouldDelete: getBlockCount( clientId ) === 1,
			isInnerButtonSelected: selectedBlockParents[ 0 ] === clientId,
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
