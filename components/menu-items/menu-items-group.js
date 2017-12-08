/**
 * Internal dependencies
 */
import './style.scss';
import { NavigableMenu } from '../navigable-container';
import MenuItemsToggle from './menu-items-toggle';

function MenuItemsGroup( { label, value, choices = [], onSelect, children } ) {
	return (
		<div className="components-choice-menu">
			<div className="components-choice-menu__label">{ label }</div>
			<NavigableMenu>
				{ choices.map( ( item ) => {
					const isSelected = value === item.value;
					return (
						<MenuItemsToggle
							key={ item.value }
							label={ item.label }
							isSelected={ isSelected }
							onClick={ () => {
								if ( ! isSelected ) {
									onSelect( item.value );
								}
							} }
						/>
					);
				} ) }
			</NavigableMenu>
			{ children }
		</div>
	);
}

export default MenuItemsGroup;
