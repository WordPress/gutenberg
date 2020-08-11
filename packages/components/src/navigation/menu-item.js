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
import { MenuItemUI, BadgeUI } from './styles/navigation-styles';
import Text from '../text';

const NavigationMenuItem = ( props ) => {
	const {
		badge,
		children,
		hasChildren,
		href,
		id,
		isActive,
		linkTag,
		linkTagProps,
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

	const LinkTagName = linkTag || Button;

	return (
		<MenuItemUI className={ classes }>
			<LinkTagName
				className={ classes }
				href={ href }
				onClick={ handleClick }
				{ ...linkTagProps }
			>
				<Text variant="body.small">
					<span>{ title }</span>
				</Text>
				{ badge && <BadgeUI>{ badge }</BadgeUI> }
				{ hasChildren ? <Icon icon={ chevronRight } /> : null }
			</LinkTagName>
		</MenuItemUI>
	);
};

export default NavigationMenuItem;
