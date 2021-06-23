/**
 * WordPress dependencies
 */
import {
	__experimentalItem as Item,
	NavigatorLink,
} from '@wordpress/components';

export const NavLink = ( props ) => {
	return (
		<Item isAction css={ { padding: 0 } }>
			<NavigatorLink
				{ ...props }
				css={ { display: 'block', padding: '8px 12px' } }
			/>
		</Item>
	);
};
