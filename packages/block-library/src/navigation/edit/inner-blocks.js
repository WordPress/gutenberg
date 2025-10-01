/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import {
	useInnerBlocksProps,
	DefaultBlockAppender,
	store as blockEditorStore,
	ButtonBlockAppender,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PlaceholderPreview from './placeholder/placeholder-preview';
import { DEFAULT_BLOCK, PRIORITIZED_INSERTER_BLOCKS } from '../constants';

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
		hasInnerBlocks,
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
				hasInnerBlocks: getBlockCount( clientId ) > 0,
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
			// Appender shown explicitly below.
			// Since the default appender needs to be shown even when child blocks are selected.
			renderAppender: false,
			placeholder: showPlaceholder ? placeholder : undefined,
			__experimentalCaptureToolbars: true,
			__unstableDisableLayoutClassNames: true,
		}
	);

	const renderAppender = () => {
		// If the block is selected and has no inner blocks, show the
		// button appender.
		if ( isSelected && ! hasInnerBlocks ) {
			return <ButtonBlockAppender rootClientId={ clientId } />;
		}

		// Show the default block appender if the block is selected or
		// if the parent or child has selection, or if the block is the
		// immediate parent of the selected block and that block has no children.
		if (
			isSelected ||
			parentOrChildHasSelection ||
			( isImmediateParentOfSelectedBlock && ! selectedBlockHasChildren )
		) {
			return <DefaultBlockAppender rootClientId={ clientId } />;
		}

		// If the block is not selected and has no inner blocks, do not render
		// an appender.
		return null;
	};

	return (
		<>
			<div { ...innerBlocksProps } />
			{ renderAppender() }
		</>
	);
}
