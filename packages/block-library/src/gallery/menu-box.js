/**
 * WordPress dependencies
 */
import { Box } from '@wordpress/components';

const MenuBox = ( { right, isSelected, isCompact, children, className } ) => {
	const side = right ? { right: '-2px' } : { left: '-2px' };
	return (
		<Box
			className={ className }
			display={ 'inline-flex' }
			padding={ isCompact ? 0 : 'small' }
			position="absolute"
			zIndex={ 'block-library-gallery-item__inline-menu' }
			bg={ isSelected ? '#ffffff' : 'inherit' }
			top="-2px"
			{ ...side }
		>
			{ children }
		</Box>
	);
};

export default MenuBox;
