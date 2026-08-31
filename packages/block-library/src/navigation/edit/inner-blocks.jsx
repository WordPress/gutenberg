import { useEntityBlockEditor } from '@wordpress/core-data';
import { useInnerBlocksProps } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import PlaceholderPreview from './placeholder/placeholder-preview';
import { DEFAULT_BLOCK, PRIORITIZED_INSERTER_BLOCKS } from '../constants';

export default function NavigationInnerBlocks( {
	hasCustomPlaceholder,
	isSelected,
	orientation,
	templateLock,
} ) {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_navigation'
	);

	const placeholder = useMemo( () => <PlaceholderPreview />, [] );

	const hasMenuItems = !! blocks?.length;

	// If there is a `ref` attribute pointing to a `wp_navigation` but
	// that menu has no **items** (i.e. empty) then show a placeholder.
	// While the block is selected the toolbar offers "Add page", so the
	// placeholder would only be telling the user what to do next.
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

			// No on-canvas appender: `defaultBlock` and `directInsert` above
			// are what the toolbar's "Add page" inserts, and what pressing
			// Enter at the end of an item adds.
			renderAppender: false,
			placeholder: showPlaceholder ? placeholder : undefined,
			__experimentalCaptureToolbars: true,
			__unstableDisableLayoutClassNames: true,
		}
	);

	return <div { ...innerBlocksProps } />;
}
