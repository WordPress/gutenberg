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
import { MenuItem } from './styles/navigation-styles';
import Text from '../text';

const NavigationMenuItem = ( props ) => {
	const {
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
				<Text variant="body.small">
					<span>{ title }</span>
				</Text>
				{ hasChildren ? <Icon icon={ chevronRight } /> : null }
			</Button>
		</MenuItem>
	);
};

export default NavigationMenuItem;
