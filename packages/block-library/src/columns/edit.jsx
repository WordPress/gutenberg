import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
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
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const DEFAULT_BLOCK = {
	name: 'core/column',
};

function ColumnInspectorControls( { setAttributes, isStackedOnMobile } ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<ToolsPanel
			label={ __( 'Settings' ) }
			resetAll={ () => {
				setAttributes( {
					isStackedOnMobile: true,
				} );
			} }
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				label={ __( 'Stack on mobile' ) }
				isShownByDefault
				hasValue={ () => isStackedOnMobile !== true }
				onDeselect={ () =>
					setAttributes( {
						isStackedOnMobile: true,
					} )
				}
			>
				<ToggleControl
					label={ __( 'Stack on mobile' ) }
					checked={ isStackedOnMobile }
					onChange={ () =>
						setAttributes( {
							isStackedOnMobile: ! isStackedOnMobile,
						} )
					}
				/>
			</ToolsPanelItem>
		</ToolsPanel>
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
	 * to override anything set on a individual column basis.
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
					setAttributes={ setAttributes }
					isStackedOnMobile={ isStackedOnMobile }
				/>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}

function Placeholder( { clientId, name, setAttributes } ) {
	const { blockType, variations } = useSelect(
		( select ) => {
			const { getBlockVariations, getBlockType } = select( blocksStore );

			return {
				blockType: getBlockType( name ),
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
				onSelect={ ( nextVariation ) => {
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
			/>
		</div>
	);
}

/**
 * Renders the `core/columns` block in the editor.
 *
 * Until the block has inner blocks it renders a variation picker; afterwards it
 * renders the columns container. Every prop is forwarded to whichever of the two
 * is rendered.
 *
 * @param {Object}         props                                Component props.
 * @param {string}         props.clientId                       Client ID of the block.
 * @param {string}         props.name                           Block name, used to look up the variations offered by the picker.
 * @param {Object}         props.attributes                     Block attributes.
 * @param {string}         [props.attributes.verticalAlignment] Vertical alignment applied to the block and to every child Column block.
 * @param {boolean}        [props.attributes.isStackedOnMobile] Whether the columns stack on small viewports. Defaults to `true`.
 * @param {string|boolean} [props.attributes.templateLock]      Template lock applied to the inner blocks, one of `all`, `insert`, `contentOnly` or `false`.
 * @param {Function}       props.setAttributes                  Callback for updating block attributes.
 *
 * @return {React.JSX.Element} React element.
 */
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
