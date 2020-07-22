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

const Item = ( { data, item, setActive, isActive } ) => {
	const children = data.filter( ( d ) => d.parent === item.slug );
	const onSelect = () => {
		const next = children.length ? children[ 0 ] : item;
		setActive( next );
	};
	const classes = classnames( 'components-navigation-item', {
		'is-active': isActive,
	} );
	return (
		<Button className={ classes } onClick={ onSelect } key={ item.slug }>
			{ item.title }
			{ children.length ? <Icon icon={ chevronRight } /> : null }
		</Button>
	);
};

export default Item;
