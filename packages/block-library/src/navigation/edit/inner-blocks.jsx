import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	useInnerBlocksProps,
	InnerBlocks,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { AsyncModeProvider, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import PlaceholderPreview from './placeholder/placeholder-preview';
import { DEFAULT_BLOCK, PRIORITIZED_INSERTER_BLOCKS } from '../constants';

function NavigationInnerBlocks( {
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
			onChange,
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

/**
 * Renders the menu items, kept in step with the menu entity.
 *
 * A block outside the viewport renders in async mode, where its updates wait
 * for an idle callback. If an edit is undone before that callback runs, the
 * entity's blocks look unchanged when this component reads them again, so it
 * never re-renders and the block editor keeps the undone edit. That happens
 * when the block is hidden, as on the navigation screen of the site editor,
 * which edits the menu in a List View. Rendering this part synchronously
 * avoids it. The menu items below it keep their own async rendering.
 *
 * @param {Object} props Props of `NavigationInnerBlocks`.
 *
 * @return {React.JSX.Element} The menu items.
 */
export default function SyncedNavigationInnerBlocks( props ) {
	return (
		<AsyncModeProvider value={ false }>
			<NavigationInnerBlocks { ...props } />
		</AsyncModeProvider>
	);
}
