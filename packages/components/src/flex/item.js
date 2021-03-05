/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Item } from './styles/flex-styles';
import { withNextFlexItem } from './next';

/**
 * @typedef {import('react').RefAttributes<HTMLDivElement> & import('react').HTMLProps<HTMLDivElement>} Props
 */

/**
 * @param {Props} props
 * @param {import('react').Ref<HTMLDivElement>} ref
 */
function FlexItem( { className, ...props }, ref ) {
	const classes = classnames( 'components-flex__item', className );

	return <Item { ...props } className={ classes } ref={ ref } />;
}

export default withNextFlexItem( forwardRef( FlexItem ) );
