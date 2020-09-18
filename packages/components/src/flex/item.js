/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { Item } from './styles/flex-styles';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

function FlexItem( { className, ...props }, ref ) {
	const classes = classnames( 'components-flex__item', className );

	return <Item { ...props } className={ classes } ref={ ref } />;
}

export default forwardRef( FlexItem );
