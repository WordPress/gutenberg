/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Icon, chevronRight } from '@wordpress/icons';
import { isValidElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import { useNavigationContext } from './context';
import { ItemBadgeUI, ItemTitleUI, ItemUI } from './styles/navigation-styles';

export default function NavigationItem( {
	badge,
	children,
	className,
	href,
	item,
	navigateToMenu,
	onClick = noop,
	title,
	...props
} ) {
	const { activeItem, setActiveMenu } = useNavigationContext();

	const classes = classnames( 'components-navigation__item', className, {
		'is-active': item && activeItem === item,
	} );

	const onItemClick = () => {
		if ( navigateToMenu ) {
			setActiveMenu( navigateToMenu );
		}

		onClick();
	};

	if ( isValidElement( children ) ) {
		return <ItemUI className={ classes }>{ children }</ItemUI>;
	}

	if ( typeof children === 'function' ) {
		return (
			<ItemUI className={ classes }>
				{ children( { setActiveMenu } ) }
			</ItemUI>
		);
	}

	return (
		<ItemUI className={ classes }>
			{
				<Button href={ href } onClick={ onItemClick } { ...props }>
					{ title && (
						<ItemTitleUI
							className="components-navigation__item-title"
							variant="body.small"
							as="span"
						>
							{ title }
						</ItemTitleUI>
					) }

					{ badge && (
						<ItemBadgeUI className="components-navigation__item-badge">
							{ badge }
						</ItemBadgeUI>
					) }

					{ navigateToMenu && <Icon icon={ chevronRight } /> }
				</Button>
			}
		</ItemUI>
	);
}
