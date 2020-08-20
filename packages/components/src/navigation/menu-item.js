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
		LinkComponent,
		linkProps,
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

	const LinkComponentTag = LinkComponent ? LinkComponent : Button;

	return (
		<MenuItemUI className={ classes }>
			<LinkComponentTag
				className={ classes }
				href={ href }
				onClick={ handleClick }
				{ ...linkProps }
			>
				<Text variant="body.small">
					<span>{ title }</span>
				</Text>
				{ badge && <BadgeUI>{ badge }</BadgeUI> }
				{ hasChildren ? <Icon icon={ chevronRight } /> : null }
			</LinkComponentTag>
		</MenuItemUI>
	);
};

export default NavigationMenuItem;
