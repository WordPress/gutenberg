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
import Text from '../text';

const NavigationMenuItem = ( { children, hasChildren, isActive, onClick } ) => {
	const classes = classnames( 'components-navigation__menu-item', {
		'is-active': isActive,
	} );

	return (
		<li className={ classes }>
			<Button className={ classes } onClick={ onClick }>
				<Text variant="body.small">
					<span>{ children }</span>
				</Text>
				{ hasChildren ? <Icon icon={ chevronRight } /> : null }
			</Button>
		</li>
	);
};

export default NavigationMenuItem;
