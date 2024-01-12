/**
 * External dependencies
 */
import { animated } from '@react-spring/web';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalTreeGridRow as TreeGridRow } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
const AnimatedTreeGridRow = animated( TreeGridRow );

const ListViewLeaf = forwardRef(
	(
		{
			isDragged,
			isSelected,
			position,
			level,
			rowCount,
			children,
			className,
			path,
			...props
		},
		ref
	) => {
		return (
			<AnimatedTreeGridRow
				ref={ ref }
				className={ classnames(
					'block-editor-list-view-leaf',
					className
				) }
				level={ level }
				positionInSet={ position }
				setSize={ rowCount }
				isExpanded={ undefined }
				{ ...props }
			>
				{ children }
			</AnimatedTreeGridRow>
		);
	}
);

export default ListViewLeaf;
