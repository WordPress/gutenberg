/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import { NavigableMenu } from '../navigable-container';
import withInstanceId from '../higher-order/with-instance-id';
import MenuItemsToggle from './menu-items-toggle';

function MenuItemsGroup( {
	label,
	value,
	choices = [],
	onSelect,
	children,
	instanceId,
	className = '',
} ) {
	const labelId = `components-choice-menu-label-${ instanceId }`;
	const classNames = classnames( className, 'components-choice-menu' );

	return (
		<div className={ classNames }>
			{ label &&
				<div className="components-choice-menu__label" id={ labelId }>{ label }</div>
			}
			<NavigableMenu orientation="vertical" aria-labelledby={ labelId }>
				{ choices.map( ( item ) => {
					const isSelected = value === item.value;
					return (
						<MenuItemsToggle
							key={ item.value }
							label={ item.label }
							isSelected={ isSelected }
							shortcut={ item.shortcut }
							onClick={ () => {
								if ( ! isSelected ) {
									onSelect( item.value );
								}
							} }
						/>
					);
				} ) }
				{ children }
			</NavigableMenu>
		</div>
	);
}

export default withInstanceId( MenuItemsGroup );
