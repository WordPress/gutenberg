/**
 * WordPress dependencies
 */
import {
	__experimentalItem as Item,
	NavigatorLink,
} from '@wordpress/components';

export const NavLink = ( props ) => {
	return (
		<Item isAction style={ { padding: 0 } }>
			<NavigatorLink
				{ ...props }
				style={ { display: 'block', padding: '8px 12px' } }
			/>
		</Item>
	);
};
