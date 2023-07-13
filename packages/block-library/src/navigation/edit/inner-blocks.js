/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	useInnerBlocksProps,
	InnerBlocks,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PlaceholderPreview from './placeholder/placeholder-preview';
import {
	DEFAULT_BLOCK,
	ALLOWED_BLOCKS,
	PRIORITIZED_INSERTER_BLOCKS,
} from '../constants';

export default function NavigationInnerBlocks( {
	clientId,
	hasCustomPlaceholder,
	orientation,
	templateLock,
	defaultBlock,
} ) {
	const {
		isImmediateParentOfSelectedBlock,
		selectedBlockHasChildren,
		isSelected,
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

	const shouldDirectInsert = useMemo(
		() =>
			blocks.every(
				( { name } ) =>
					name === 'core/navigation-link' ||
					name === 'core/navigation-submenu' ||
					name === 'core/page-list'
			),
		[ blocks ]
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

	// If the `defaultBlock` attribute is set and itself has an attributes object with values then use it
	// otherwise fallback to the DEFAULT_BLOCK constant.
	// This allows site owners to set the default `core/navigation-link` variation to use.
	const navDefaultBlock = defaultBlock?.attributes && Object.keys(defaultBlock.attributes).length > 0 ? defaultBlock : DEFAULT_BLOCK;	

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-navigation__container',
		},
		{
			value: blocks,
			onInput,
			onChange,
			allowedBlocks: ALLOWED_BLOCKS,
			prioritizedInserterBlocks: PRIORITIZED_INSERTER_BLOCKS,
			defaultBlock: navDefaultBlock,
			directInsert: shouldDirectInsert,
			orientation,
			templateLock,

			// As an exception to other blocks which feature nesting, show
			// the block appender even when a child block is selected.
			// This should be a temporary fix, to be replaced by improvements to
			// the sibling inserter.
			// See https://github.com/WordPress/gutenberg/issues/37572.
			renderAppender:
				isSelected ||
				( isImmediateParentOfSelectedBlock &&
					! selectedBlockHasChildren ) ||
				// Show the appender while dragging to allow inserting element between item and the appender.
				parentOrChildHasSelection
					? InnerBlocks.ButtonBlockAppender
					: false,
			placeholder: showPlaceholder ? placeholder : undefined,
		}
	);

	return <div { ...innerBlocksProps } />;
}
