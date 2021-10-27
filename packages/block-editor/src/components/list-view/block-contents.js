/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
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
		return (
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
