/**
 * External dependencies
 */
import classnames from 'classnames';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Notice,
	PanelBody,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import {
	InspectorControls,
	useInnerBlocksProps,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	__experimentalBlockVariationPicker,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getRevisedColumns, getVacantIndexes } from './utils';

/**
 * Allowed blocks constant is passed to InnerBlocks precisely as specified here.
 * The contents of the array should never change.
 * The array should contain the name of each block that is allowed.
 * In columns block, the only block we allow is 'core/column'.
 *
 * @constant
 * @type {string[]}
 */
const ALLOWED_BLOCKS = [ 'core/column' ];

function ColumnsEdit( { attributes, clientId, setAttributes } ) {
	const { getBlocks, getBlockOrder } = useSelect(
		( select ) => select( blockEditorStore ),
		[]
	);

	const { updateBlockAttributes, replaceInnerBlocks } = useDispatch(
		blockEditorStore
	);

	/**
	 * Update all child Column blocks with a new vertical alignment setting
	 * based on whatever alignment is passed in. This allows change to parent
	 * to overide anything set on a individual column basis.
	 *
	 * @param {string} nextVerticalAlignment the vertical alignment setting
	 */
	const updateAlignment = ( nextVerticalAlignment ) => {
		// Update own alignment.
		setAttributes( { verticalAlignment: nextVerticalAlignment } );

		// Update all child Column Blocks to match
		getBlockOrder( clientId ).forEach( ( innerBlockClientId ) => {
			updateBlockAttributes( innerBlockClientId, {
				nextVerticalAlignment,
			} );
		} );
	};

	// Memoizing this prevents duplicate calls when used as onChange for
	// ToggleGroupControl
	const updateColumns = useCallback(
		( nextCount ) => {
			const currentBlocks = getBlocks( clientId );
			const revised = getRevisedColumns( currentBlocks, nextCount );
			replaceInnerBlocks( clientId, revised );
		},
		[ clientId ]
	);

	const { isStackedOnMobile, verticalAlignment } = attributes;

	const classes = classnames( {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
		[ `is-not-stacked-on-mobile` ]: ! isStackedOnMobile,
	} );

	const blockProps = useBlockProps( {
		className: classes,
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		orientation: 'horizontal',
		renderAppender: false,
	} );

	const layoutPanelProps = {
		clientId,
		isStackedOnMobile,
		updateColumns,
		setAttributes,
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
				<ColumnsLayoutPanel { ...layoutPanelProps } />
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}

function ColumnsLayoutPanel( {
	clientId,
	isStackedOnMobile,
	updateColumns,
	setAttributes,
} ) {
	const blocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks( clientId ),
		[ clientId ]
	);
	const vacancies = getVacantIndexes( blocks ).length;
	const count = blocks.length;
	const countMin = Math.max( 1, count - vacancies );
	const countMax = 6;
	const countOptionList = [];
	for ( let i = 1; i <= countMax; i++ ) {
		const disabled = i < countMin;
		const itemProps = { disabled, value: i, label: i, key: i };
		countOptionList.push( <ToggleGroupControlOption { ...itemProps } /> );
	}
	if ( count > countMax ) {
		const itemProps = { value: count, label: count, key: count };
		countOptionList.push( <ToggleGroupControlOption { ...itemProps } /> );
	}
	return (
		<PanelBody title={ __( 'Layout' ) }>
			<ToggleGroupControl
				label={ __( 'Quantity' ) }
				onChange={ updateColumns }
				value={ count }
			>
				{ countOptionList }
			</ToggleGroupControl>
			{ count > 6 && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'This column count exceeds the recommended amount and may cause visual breakage.'
					) }
				</Notice>
			) }
			<ToggleControl
				label={ __( 'Stack on mobile' ) }
				checked={ isStackedOnMobile }
				onChange={ () =>
					setAttributes( {
						isStackedOnMobile: ! isStackedOnMobile,
					} )
				}
			/>
		</PanelBody>
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
				icon={ get( blockType, [ 'icon', 'src' ] ) }
				label={ get( blockType, [ 'title' ] ) }
				variations={ variations }
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

const MetaColumnsEdit = ( props ) => {
	const { clientId } = props;
	const hasInnerBlocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlocks( clientId ).length > 0,
		[ clientId ]
	);
	const Component = hasInnerBlocks ? ColumnsEdit : Placeholder;

	return <Component { ...props } />;
};

export default MetaColumnsEdit;
