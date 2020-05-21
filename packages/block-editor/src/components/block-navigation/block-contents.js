/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBlockNavigationContext } from './context';
import BlockNavigationBlockSlot from './block-slot';
import BlockNavigationBlockSelectButton from './block-select-button';

const BlockNavigationBlockContents = forwardRef(
	(
		{ onClick, block, isSelected, position, siblingCount, level, ...props },
		ref
	) => {
		const {
			__experimentalWithBlockNavigationSlots: withBlockNavigationSlots,
		} = useBlockNavigationContext();

		return withBlockNavigationSlots ? (
			<BlockNavigationBlockSlot
				className="block-editor-block-navigation-block-contents"
				block={ block }
				onClick={ onClick }
				isSelected={ isSelected }
				position={ position }
				siblingCount={ siblingCount }
				level={ level }
				{ ...props }
				ref={ ref }
			/>
		) : (
			<BlockNavigationBlockSelectButton
				className="block-editor-block-navigation-block-contents"
				block={ block }
				onClick={ onClick }
				isSelected={ isSelected }
				position={ position }
				siblingCount={ siblingCount }
				level={ level }
				{ ...props }
				ref={ ref }
			/>
		);
	}
);

export default BlockNavigationBlockContents;
