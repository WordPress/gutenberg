/**
 * WordPress dependencies
 */
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { isRTL, __ } from '@wordpress/i18n';
import {
	formatListBullets,
	formatListBulletsRTL,
	formatListNumbered,
	formatListNumberedRTL,
	formatOutdent,
	formatOutdentRTL,
} from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';
import { useCallback, useEffect, Platform } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import OrderedListSettings from './ordered-list-settings';
import { migrateToListV2 } from './utils';
import TagName from './tag-name';

const TEMPLATE = [ [ 'core/list-item' ] ];
const NATIVE_MARGIN_SPACING = 8;

/**
 * At the moment, deprecations don't handle create blocks from attributes
 * (like when using CPT templates). For this reason, this hook is necessary
 * to avoid breaking templates using the old list block format.
 *
 * @param {Object} attributes Block attributes.
 * @param {string} clientId   Block client ID.
 */
function useMigrateOnLoad( attributes, clientId ) {
	const registry = useRegistry();
	const { updateBlockAttributes, replaceInnerBlocks } =
		useDispatch( blockEditorStore );

	useEffect( () => {
		// As soon as the block is loaded, migrate it to the new version.

		if ( ! attributes.values ) {
			return;
		}

		const [ newAttributes, newInnerBlocks ] = migrateToListV2( attributes );

		deprecated( 'Value attribute on the list block', {
			since: '6.0',
			version: '6.5',
			alternative: 'inner blocks',
		} );

		registry.batch( () => {
			updateBlockAttributes( clientId, newAttributes );
			replaceInnerBlocks( clientId, newInnerBlocks );
		} );
	}, [ attributes.values ] );
}

function useOutdentList( clientId ) {
	const { replaceBlocks, selectionChange } = useDispatch( blockEditorStore );
	const { getBlockRootClientId, getBlockAttributes, getBlock } =
		useSelect( blockEditorStore );

	return useCallback( () => {
		const parentBlockId = getBlockRootClientId( clientId );
		const parentBlockAttributes = getBlockAttributes( parentBlockId );
		// Create a new parent block without the inner blocks.
		const newParentBlock = createBlock(
			'core/list-item',
			parentBlockAttributes
		);
		const { innerBlocks } = getBlock( clientId );
		// Replace the parent block with a new parent block without inner blocks,
		// and make the inner blocks siblings of the parent.
		replaceBlocks( [ parentBlockId ], [ newParentBlock, ...innerBlocks ] );
		// Select the last child of the list being outdent.
		selectionChange( innerBlocks[ innerBlocks.length - 1 ].clientId );
	}, [ clientId ] );
}

function IndentUI( { clientId } ) {
	const outdentList = useOutdentList( clientId );
	const canOutdent = useSelect(
		( select ) => {
			const { getBlockRootClientId, getBlockName } =
				select( blockEditorStore );
			return (
				getBlockName( getBlockRootClientId( clientId ) ) ===
				'core/list-item'
			);
		},
		[ clientId ]
	);
	return (
		<>
			<ToolbarButton
				icon={ isRTL() ? formatOutdentRTL : formatOutdent }
				title={ __( 'Outdent' ) }
				describedBy={ __( 'Outdent list item' ) }
				disabled={ ! canOutdent }
				onClick={ outdentList }
			/>
		</>
	);
}

export default function Edit( { attributes, setAttributes, clientId, style } ) {
	const { ordered, type, reversed, start } = attributes;
	const blockProps = useBlockProps( {
		style: {
			...( Platform.isNative && style ),
			listStyleType: ordered && type !== 'decimal' ? type : undefined,
		},
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		templateLock: false,
		templateInsertUpdatesSelection: true,
		...( Platform.isNative && {
			marginVertical: NATIVE_MARGIN_SPACING,
			marginHorizontal: NATIVE_MARGIN_SPACING,
			renderAppender: false,
		} ),
		__experimentalCaptureToolbars: true,
	} );
	useMigrateOnLoad( attributes, clientId );

	const controls = (
		<BlockControls group="block">
			<ToolbarButton
				icon={ isRTL() ? formatListBulletsRTL : formatListBullets }
				title={ __( 'Unordered' ) }
				describedBy={ __( 'Convert to unordered list' ) }
				isActive={ ordered === false }
				onClick={ () => {
					setAttributes( { ordered: false } );
				} }
			/>
			<ToolbarButton
				icon={ isRTL() ? formatListNumberedRTL : formatListNumbered }
				title={ __( 'Ordered' ) }
				describedBy={ __( 'Convert to ordered list' ) }
				isActive={ ordered === true }
				onClick={ () => {
					setAttributes( { ordered: true } );
				} }
			/>
			<IndentUI clientId={ clientId } />
		</BlockControls>
	);

	return (
		<>
			<TagName
				ordered={ ordered }
				reversed={ reversed }
				start={ start }
				{ ...innerBlocksProps }
			/>
			{ controls }
			{ ordered && (
				<OrderedListSettings
					{ ...{
						setAttributes,
						reversed,
						start,
						type,
					} }
				/>
			) }
		</>
	);
}
