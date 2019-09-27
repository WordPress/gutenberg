/**
 * WordPress dependencies
 */
import { Box } from '@wordpress/components';

const MenuBox = ( { right, isSelected, isCompact, children } ) => {
	const side = right ? { right: '-2px' } : { left: '-2px' };
	return (
		<Box
			display={ 'inline-flex' }
			padding={ isCompact ? 0 : 'small' }
			position="absolute"
			zIndex={ 'block-library-gallery-item__inline-menu' }
			bg={ isSelected ? 'primary' : 'inherit' }
			top="-2px"
			{ ...side }
		>
			{ children }
		</Box>
	);
};

export default MenuBox;
