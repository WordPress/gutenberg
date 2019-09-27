/**
 * WordPress dependencies
 */
import { Box, withTheme } from '@wordpress/components';

const MenuBox = ( { right, isSelected, isCompact, theme, children } ) => {
	const padding = isCompact ? 0 : theme.space.small;
	const side = right ? { right: '-2px' } : { left: '-2px' };
	return (
		<Box
			display={ 'inline-flex' }
			padding={ padding }
			position="absolute"
			zIndex={ 20 }
			bg={ isSelected ? 'primary' : 'inherit' }
			top="-2px"
			{ ...side }
		>
			{ children }
		</Box>
	);
};

export default withTheme( MenuBox );
