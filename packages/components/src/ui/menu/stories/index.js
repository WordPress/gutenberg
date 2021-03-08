/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Menu, MenuItem, MenuHeader } from '..';

export default {
	component: Menu,
	title: 'G2 Components (Experimental)/Menu',
};

const Example = () => {
	const [ isSelected, setIsSelected ] = useState( false );
	return (
		<Menu css={ { width: '150px' } }>
			<MenuHeader>WordPress.org</MenuHeader>
			<MenuItem
				isSelected={ isSelected }
				onClick={ () => setIsSelected( ! isSelected ) }
			>
				Code is Poetry
			</MenuItem>
		</Menu>
	);
};

export const _default = () => <Example />;
