/**
 * WordPress dependencies
 */
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MenuItem from '../menu-item';
import type { MenuItemsChoiceProps } from './types';

const noop = () => {};

/**
 * `MenuItemsChoice` functions similarly to a set of `MenuItem`s, but allows the user to select one option from a set of multiple choices.
 *
 *
 * ```jsx
 * import { MenuGroup, MenuItemsChoice } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyMenuItemsChoice = () => {
 * 	const [ mode, setMode ] = useState( 'visual' );
 * 	const choices = [
 * 		{
 * 			value: 'visual',
 * 			label: 'Visual editor',
 * 		},
 * 		{
 * 			value: 'text',
 * 			label: 'Code editor',
 * 		},
 * 	];
 *
 * 	return (
 * 		<MenuGroup label="Editor">
 * 			<MenuItemsChoice
 * 				choices={ choices }
 * 				value={ mode }
 * 				onSelect={ ( newMode ) => setMode( newMode ) }
 * 			/>
 * 		</MenuGroup>
 * 	);
 * };
 * ```
 */
function MenuItemsChoice( {
	choices = [],
	onHover = noop,
	onSelect,
	value,
}: MenuItemsChoiceProps ) {
	return (
		<>
			{ choices.map( ( item ) => {
				const isSelected = value === item.value;
				return (
					<MenuItem
						key={ item.value }
						role="menuitemradio"
						icon={ isSelected && check }
						info={ item.info }
						isSelected={ isSelected }
						shortcut={ item.shortcut }
						className="components-menu-items-choice"
						onClick={ () => {
							if ( ! isSelected ) {
								onSelect( item.value );
							}
						} }
						onMouseEnter={ () => onHover( item.value ) }
						onMouseLeave={ () => onHover( null ) }
						aria-label={ item[ 'aria-label' ] }
					>
						{ item.label }
					</MenuItem>
				);
			} ) }
		</>
	);
}

export default MenuItemsChoice;
