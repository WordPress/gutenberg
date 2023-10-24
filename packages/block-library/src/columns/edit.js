/**
 * External dependencies
 */
import clsx from 'clsx';

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
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getRevisedColumns, getDispensableIndexes } from './utils';

const DEFAULT_BLOCK = {
	name: 'core/column',
};

function ColumnInspectorControls( {
	clientId,
	setAttributes,
	isStackedOnMobile,
} ) {
	const { columns, canInsertColumn } = useSelect(
		( select ) => {
			const selectors = select( blockEditorStore );
			return {
				columns: selectors.getBlocks( clientId ),
				canInsertColumn: selectors.canInsertBlockType(
					'core/column',
					clientId
				),
			};
		},
		[ clientId ]
	);
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	let quantityControl;
	if ( canInsertColumn ) {
		const updateColumns = ( nextCount ) => {
			const revisedColumns = getRevisedColumns( columns, nextCount );
			replaceInnerBlocks( clientId, revisedColumns );
		};
		// TODO: here canRemoveBlock is no longer used and it’d be due diligence to make
		// sure there’s not a need to use it. getDispensableIndexes just checks attributes.lock.remove
		// but maybe that can suffice in this context.
		const dispensableColumns = getDispensableIndexes( columns );
		const count = columns.length;
		const countMin = Math.max( 1, count - dispensableColumns.length );
		const countMax = 6;
		const optionList = [];
		for ( let i = 1; i <= countMax; i++ ) {
			const disabled = i < countMin;
			const itemProps = { disabled, value: i, label: i, key: i };
			optionList.push( <ToggleGroupControlOption { ...itemProps } /> );
		}
		if ( count > countMax ) {
			const itemProps = { value: count, label: count, key: count };
			optionList.push( <ToggleGroupControlOption { ...itemProps } /> );
		}
		let help;
		if ( countMin > 6 ) {
			help = `Options disabled due to six or more columns being nonempty or locked.`;
		} else if ( countMin > 1 ) {
			help = `Options for fewer than ${ countMin } disabled due to some columns being nonempty or locked.`;
		}
		quantityControl = (
			<>
				<ToggleGroupControl
					help={ help }
					label={ __( 'Columns' ) }
					onChange={ updateColumns }
					value={ count }
					__nextHasNoMarginBottom
				>
					{ optionList }
				</ToggleGroupControl>
				{ count > 6 && (
					<Notice status="warning" isDismissible={ false }>
						{ __(
							'This column count exceeds the recommended amount and may cause visual breakage.'
						) }
					</Notice>
				) }
			</>
		);
	}
	return (
		<PanelBody title={ __( 'Settings' ) }>
			{ quantityControl }
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
	);
}

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
				<ColumnInspectorControls
					clientId={ clientId }
					setAttributes={ setAttributes }
					isStackedOnMobile={ isStackedOnMobile }
				/>
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
