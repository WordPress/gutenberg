import clsx from 'clsx';
import {
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { sprintf, __ } from '@wordpress/i18n';
import { getColumnFlexBasis } from './utils';

/**
 * Renders the `core/column` block in the editor.
 *
 * @param {Object}         props                                Component props.
 * @param {Object}         props.attributes                     Block attributes.
 * @param {string}         [props.attributes.verticalAlignment] Vertical alignment of the column, one of `top`, `center`, `bottom` or `stretch`. Setting it resets the alignment on the parent Columns block.
 * @param {Object}         [props.attributes.style]             Block style attribute. Its `dimensions.width` value is applied as the column's `flex-basis`.
 * @param {string|boolean} [props.attributes.templateLock]      Template lock applied to the inner blocks, one of `all`, `insert`, `contentOnly` or `false`.
 * @param {string[]}       [props.attributes.allowedBlocks]     Names of the blocks allowed as inner blocks, added by the `allowedBlocks` block support.
 * @param {Function}       props.setAttributes                  Callback for updating block attributes.
 * @param {string}         props.clientId                       Client ID of the block.
 *
 * @return {React.JSX.Element} React element.
 */
function ColumnEdit( {
	attributes: { verticalAlignment, style, templateLock, allowedBlocks },
	setAttributes,
	clientId,
} ) {
	const classes = clsx( 'block-core-columns', {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );
	const { columnsIds, hasChildBlocks, rootClientId } = useSelect(
		( select ) => {
			const { getBlockOrder, getBlockRootClientId } =
				select( blockEditorStore );

			const rootId = getBlockRootClientId( clientId );

			return {
				hasChildBlocks: getBlockOrder( clientId ).length > 0,
				rootClientId: rootId,
				columnsIds: getBlockOrder( rootId ),
			};
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const updateAlignment = ( value ) => {
		// Update own alignment.
		setAttributes( { verticalAlignment: value } );
		// Reset parent Columns block.
		updateBlockAttributes( rootClientId, {
			verticalAlignment: null,
		} );
	};

	const flexBasis = getColumnFlexBasis( style?.dimensions?.width );
	const blockProps = useBlockProps( {
		className: classes,
		style: flexBasis ? { flexBasis } : undefined,
	} );

	const columnsCount = columnsIds.length;
	const currentColumnPosition = columnsIds.indexOf( clientId ) + 1;

	const label = sprintf(
		/* translators: 1: Block label (i.e. "Block: Column"), 2: Position of the selected block, 3: Total number of sibling blocks of the same type */
		__( '%1$s (%2$d of %3$d)' ),
		blockProps[ 'aria-label' ],
		currentColumnPosition,
		columnsCount
	);

	const innerBlocksProps = useInnerBlocksProps(
		{ ...blockProps, 'aria-label': label },
		{
			templateLock,
			allowedBlocks,
			renderAppender: hasChildBlocks
				? false
				: InnerBlocks.ButtonBlockAppender,
		}
	);

	return (
		<>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
					controls={ [ 'top', 'center', 'bottom', 'stretch' ] }
				/>
			</BlockControls>
			<div { ...innerBlocksProps } />
		</>
	);
}

export default ColumnEdit;
