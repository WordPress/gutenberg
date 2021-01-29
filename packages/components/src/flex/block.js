/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import { Block } from './styles/flex-styles';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * @typedef {import('react').HTMLProps<HTMLDivElement>} Props
 */

/**
 * @param {Props} props
 * @param {import('react').Ref<HTMLDivElement>} ref
 */
function FlexBlock( { className, ...props }, ref ) {
	const classes = classnames( 'components-flex__block', className );

	return <Block { ...props } className={ classes } ref={ ref } />;
}

export default forwardRef( FlexBlock );
