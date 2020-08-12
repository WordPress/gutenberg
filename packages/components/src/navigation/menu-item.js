/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import { Badge, MenuItem, MenuItemText } from './styles/navigation-styles';

const NavigationMenuItem = ( props ) => {
	const {
		badge,
		children,
		hasChildren,
		id,
		isActive,
		onClick,
		setActiveLevel,
		title,
	} = props;
	const classes = classnames( 'components-navigation__menu-item', {
		'is-active': isActive,
	} );

	const handleClick = () => {
		if ( children.length ) {
			setActiveLevel( id );
			return;
		}
		onClick( props );
	};

	return (
		<MenuItem className={ classes }>
			<Button className={ classes } onClick={ handleClick }>
				<MenuItemText variant="body.small" as="span">
					{ title }
				</MenuItemText>
				{ badge && <Badge>{ badge }</Badge> }
				{ hasChildren ? <Icon icon={ chevronRight } /> : null }
			</Button>
		</MenuItem>
	);
};

export default NavigationMenuItem;
