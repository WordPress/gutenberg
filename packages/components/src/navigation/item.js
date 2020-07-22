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

const Item = ( { data, item, onSelect, isActive } ) => {
	const children = data.filter( ( d ) => d.parent === item.slug );
	const onClick = () => {
		const next = children.length ? children[ 0 ] : item;
		onSelect( next.slug );
	};
	const classes = classnames( 'components-navigation__menu-item', {
		'is-active': isActive,
	} );
	return (
		<Button className={ classes } onClick={ onClick } key={ item.slug }>
			<Text variant="body.small">
				<span>{ item.title }</span>
			</Text>
			{ children.length ? <Icon icon={ chevronRight } /> : null }
		</Button>
	);
};

export default Item;
