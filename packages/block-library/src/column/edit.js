/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InspectorControls,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl, ResizableBox } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

function ColumnEdit( {
	attributes,
	setAttributes,
	updateAlignment,
	hasChildBlocks,
	isFirst,
	isLast,
	gap,
} ) {
	const { verticalAlignment, width } = attributes;
	const [ columnWidth, setColumnWidth ] = useState();
	const [ isHovered, setIsHovered ] = useState( false );

	const classes = classnames( 'block-core-columns', {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const paddingLeft = ! isFirst ? gap / 2 : 0;
	const paddingRight = ! isLast ? gap / 2 : 0;

	const columnStyle = {
		paddingLeft,
		paddingRight,
		width: columnWidth ? columnWidth : null,
		flex: ! columnWidth ? 1 : null,
		boxShadow: isHovered ? '0 0 0 1px rgba(0, 0, 255, 0.4) inset' : null,
	};

	return (
		<>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Column settings' ) }>
					<RangeControl
						label={ __( 'Percentage width' ) }
						value={ width || '' }
						onChange={ ( nextWidth ) => {
							setAttributes( { width: nextWidth } );
						} }
						min={ 0 }
						max={ 100 }
						step={ 0.1 }
						required
						allowReset
						placeholder={
							width === undefined ? __( 'Auto' ) : undefined
						}
					/>
				</PanelBody>
			</InspectorControls>
			<ResizableBox
				enable={ {
					top: false,
					right: ! isLast,
					bottom: false,
					left: false,
					topRight: false,
					bottomRight: false,
					bottomLeft: false,
					topLeft: false,
				} }
				onResize={ ( event, direction, elt, delta ) => {
					setColumnWidth(
						parseInt( ( columnWidth || 0 ) + delta.width, 10 )
					);
				} }
				onMouseMove={ ( event ) => {
					const isHovering = event.target.matches( ':hover' );
					if ( ! isHovered && isHovering ) {
						setIsHovered( true );
					}
				} }
				onMouseLeave={ () => {
					setIsHovered( false );
				} }
				style={ columnStyle }
			>
				<InnerBlocks
					templateLock={ false }
					renderAppender={
						hasChildBlocks
							? undefined
							: () => <InnerBlocks.ButtonBlockAppender />
					}
					__experimentalTagName={ Block.div }
					__experimentalPassedProps={ {
						className: classes,
					} }
				/>
			</ResizableBox>
		</>
	);
}

export default compose(
	withSelect( ( select, ownProps ) => {
		const { clientId } = ownProps;
		const { getBlockOrder } = select( 'core/block-editor' );
		const { getBlockRootClientId } = select( 'core/block-editor' );

		const rootClientId = getBlockRootClientId( clientId );

		const rootBlock = select( 'core/block-editor' ).getBlock(
			rootClientId
		);
		const rootBlocks = rootBlock.innerBlocks;
		const currentBlock = rootBlocks.find(
			( block ) => block.clientId === clientId
		);

		const gap = rootBlock.attributes.gap;
		const index = rootBlocks.indexOf( currentBlock );
		const isFirst = index === 0;
		const isLast = index === rootBlocks.length - 1;

		return {
			gap,
			index,
			isFirst,
			isLast,
			hasChildBlocks: getBlockOrder( clientId ).length > 0,
		};
	} ),
	withDispatch( ( dispatch, ownProps, registry ) => {
		return {
			updateAlignment( verticalAlignment ) {
				const { clientId, setAttributes } = ownProps;
				const { updateBlockAttributes } = dispatch(
					'core/block-editor'
				);
				const { getBlockRootClientId } = registry.select(
					'core/block-editor'
				);

				// Update own alignment.
				setAttributes( { verticalAlignment } );

				// Reset Parent Columns Block
				const rootClientId = getBlockRootClientId( clientId );
				updateBlockAttributes( rootClientId, {
					verticalAlignment: null,
				} );
			},
		};
	} )
)( ColumnEdit );
