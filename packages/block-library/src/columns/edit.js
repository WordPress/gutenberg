/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl } from '@wordpress/components';

import {
	InspectorControls,
	useInnerBlocksProps,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	__experimentalBlockVariationPicker,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';

const DEFAULT_BLOCK = {
	name: 'core/column',
};

function ColumnsEditContainer( { attributes, setAttributes, clientId } ) {
	const { isStackedOnMobile, verticalAlignment, templateLock } = attributes;
	const registry = useRegistry();
	const { getBlockOrder } = useSelect( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const classes = clsx( {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
		[ `is-not-stacked-on-mobile` ]: ! isStackedOnMobile,
	} );

	const blockProps = useBlockProps( {
		className: classes,
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		defaultBlock: DEFAULT_BLOCK,
		directInsert: true,
		orientation: 'horizontal',
		renderAppender: false,
		templateLock,
	} );

	/**
	 * Update all child Column blocks with a new vertical alignment setting
	 * based on whatever alignment is passed in. This allows change to parent
	 * to overide anything set on a individual column basis.
	 *
	 * @param {string} newVerticalAlignment The vertical alignment setting.
	 */
	function updateAlignment( newVerticalAlignment ) {
		const innerBlockClientIds = getBlockOrder( clientId );

		// Update own and child Column block vertical alignments.
		// This is a single action; the batching prevents creating multiple history records.
		registry.batch( () => {
			setAttributes( { verticalAlignment: newVerticalAlignment } );
			updateBlockAttributes( innerBlockClientIds, {
				verticalAlignment: newVerticalAlignment,
			} );
		} );
	}

	return (
		<>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Stack on mobile' ) }
						checked={ isStackedOnMobile }
						onChange={ () =>
							setAttributes( {
								isStackedOnMobile: ! isStackedOnMobile,
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}

function Placeholder( { clientId, name, setAttributes } ) {
	const { blockType, defaultVariation, variations } = useSelect(
		( select ) => {
			const {
				getBlockVariations,
				getBlockType,
				getDefaultBlockVariation,
			} = select( blocksStore );

			return {
				blockType: getBlockType( name ),
				defaultVariation: getDefaultBlockVariation( name, 'block' ),
				variations: getBlockVariations( name, 'block' ),
			};
		},
		[ name ]
	);
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			<__experimentalBlockVariationPicker
				icon={ blockType?.icon?.src }
				label={ blockType?.title }
				variations={ variations }
				instructions={ __( 'Divide into columns. Select a layout:' ) }
				onSelect={ ( nextVariation = defaultVariation ) => {
					if ( nextVariation.attributes ) {
						setAttributes( nextVariation.attributes );
					}
					if ( nextVariation.innerBlocks ) {
						replaceInnerBlocks(
							clientId,
							createBlocksFromInnerBlocksTemplate(
								nextVariation.innerBlocks
							),
							true
						);
					}
				} }
				allowSkip
			/>
		</div>
	);
}

const ColumnsEdit = ( props ) => {
	const { clientId } = props;
	const hasInnerBlocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlocks( clientId ).length > 0,
		[ clientId ]
	);
	const Component = hasInnerBlocks ? ColumnsEditContainer : Placeholder;

	return <Component { ...props } />;
};

export default ColumnsEdit;
