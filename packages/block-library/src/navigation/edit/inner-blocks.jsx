import {
	useEntityBlockEditor,
	useEntityId,
	store as coreStore,
} from '@wordpress/core-data';
import {
	useInnerBlocksProps,
	InnerBlocks,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import PlaceholderPreview from './placeholder/placeholder-preview';
import { DEFAULT_BLOCK, PRIORITIZED_INSERTER_BLOCKS } from '../constants';
import { unlock } from '../../lock-unlock';

const AUTO_ADD_PAGES_META_KEY = 'wp_navigation_auto_add_pages';

export default function NavigationInnerBlocks( {
	clientId,
	hasCustomPlaceholder,
	orientation,
	templateLock,
} ) {
	const {
		isImmediateParentOfSelectedBlock,
		selectedBlockHasChildren,
		isSelected,
		hasSelectedDescendant,
	} = useSelect(
		( select ) => {
			const {
				getBlockCount,
				hasSelectedInnerBlock,
				getSelectedBlockClientId,
			} = select( blockEditorStore );
			const selectedBlockId = getSelectedBlockClientId();

			return {
				isImmediateParentOfSelectedBlock: hasSelectedInnerBlock(
					clientId,
					false
				),
				selectedBlockHasChildren: !! getBlockCount( selectedBlockId ),
				hasSelectedDescendant: hasSelectedInnerBlock( clientId, true ),

				// This prop is already available but computing it here ensures it's
				// fresh compared to isImmediateParentOfSelectedBlock.
				isSelected: selectedBlockId === clientId,
			};
		},
		[ clientId ]
	);

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_navigation'
	);
	const menuId = useEntityId( 'postType', 'wp_navigation' );
	const registry = useRegistry();
	const { editEntityRecord } = useDispatch( coreStore );

	// When an edit replaces a Page List in this menu with its links (see the
	// Page List block), the menu takes over adding new pages: switch "Auto
	// add new pages" on. A cached edit joins the undo level `onChange` just
	// added, so one undo reverts the edit, the replacement and the setting.
	const onChangeWithAutoAddPages = useCallback(
		( newBlocks, options ) => {
			// Read before `onChange`: the signal covers only the latest
			// change to the blocks.
			const { getLastDetachedBlocks, getBlockParents } = unlock(
				registry.select( blockEditorStore )
			);
			const hasDetachedPageList = getLastDetachedBlocks().some(
				( { name, rootClientId } ) =>
					name === 'core/page-list' &&
					( rootClientId === clientId ||
						getBlockParents( rootClientId ).includes( clientId ) )
			);
			onChange( newBlocks, options );
			if ( hasDetachedPageList ) {
				editEntityRecord(
					'postType',
					'wp_navigation',
					menuId,
					{ meta: { [ AUTO_ADD_PAGES_META_KEY ]: true } },
					{ isCached: true }
				);
			}
		},
		[ onChange, registry, clientId, editEntityRecord, menuId ]
	);

	// When the block is selected itself or has a top level item selected that
	// doesn't itself have children, show the standard appender. Else show no
	// appender.
	const parentOrChildHasSelection =
		isSelected ||
		( isImmediateParentOfSelectedBlock && ! selectedBlockHasChildren );

	const placeholder = useMemo( () => <PlaceholderPreview />, [] );

	const hasMenuItems = !! blocks?.length;

	// If there is a `ref` attribute pointing to a `wp_navigation` but
	// that menu has no **items** (i.e. empty) then show a placeholder.
	// The block must also be selected else the placeholder will display
	// alongside the appender.
	const showPlaceholder =
		! hasCustomPlaceholder && ! hasMenuItems && ! isSelected;

	// When the block is selected but has no items yet, show the button
	// appender. Otherwise, show the dropdown appender.
	// As an exception to other blocks which feature nesting, the appender stays
	// visible even when a child block (or a submenu item) is selected.
	// See https://github.com/WordPress/gutenberg/issues/37572.
	let renderAppender = false;
	if ( isSelected && ! hasMenuItems ) {
		renderAppender = InnerBlocks.ButtonBlockAppender;
	} else if ( parentOrChildHasSelection || hasSelectedDescendant ) {
		renderAppender = InnerBlocks.DefaultBlockAppender;
	}

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-navigation__container',
		},
		{
			value: blocks,
			onInput,
			onChange: onChangeWithAutoAddPages,
			prioritizedInserterBlocks: PRIORITIZED_INSERTER_BLOCKS,
			defaultBlock: DEFAULT_BLOCK,
			directInsert: true,
			orientation,
			templateLock,
			renderAppender,
			placeholder: showPlaceholder ? placeholder : undefined,
			__experimentalCaptureToolbars: true,
			__unstableDisableLayoutClassNames: true,
		}
	);

	return <div { ...innerBlocksProps } />;
}
