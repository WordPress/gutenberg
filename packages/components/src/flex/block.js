/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import Item from './item';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

function FlexBlock( { className, ...props }, ref ) {
	const classes = classnames( 'components-flex__block', className );

	return <Item { ...props } className={ classes } isBlock ref={ ref } />;
}

export default forwardRef( FlexBlock );
