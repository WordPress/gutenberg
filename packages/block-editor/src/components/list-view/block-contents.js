/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useListViewContext } from './context';
import ListViewBlockSlot from './block-slot';
import ListViewBlockSelectButton from './block-select-button';

const ListViewBlockContents = forwardRef(
	(
		{
			onClick,
			onToggleExpanded,
			block,
			isSelected,
			position,
			siblingBlockCount,
			level,
			...props
		},
		ref
	) => {
		const { __experimentalFeatures } = useListViewContext();

		return __experimentalFeatures ? (
			<ListViewBlockSlot
				ref={ ref }
				className="block-editor-list-view-block-contents"
				block={ block }
				onToggleExpanded={ onToggleExpanded }
				isSelected={ isSelected }
				position={ position }
				siblingBlockCount={ siblingBlockCount }
				level={ level }
				{ ...props }
			/>
		) : (
			<ListViewBlockSelectButton
				ref={ ref }
				className="block-editor-list-view-block-contents"
				block={ block }
				onClick={ onClick }
				onToggleExpanded={ onToggleExpanded }
				isSelected={ isSelected }
				position={ position }
				siblingBlockCount={ siblingBlockCount }
				level={ level }
				{ ...props }
			/>
		);
	}
);

export default ListViewBlockContents;
