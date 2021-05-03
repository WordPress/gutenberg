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
import { Block } from './styles/flex-styles';
import { withNextFlexBlock } from './next';

/**
 * @typedef {import('react').HTMLProps<HTMLDivElement> & import('react').RefAttributes<HTMLDivElement>} Props
 */

/**
 * @param {Props} props
 * @param {import('react').Ref<HTMLDivElement>} ref
 */
function FlexBlock( { className, ...props }, ref ) {
	const classes = classnames( 'components-flex__block', className );

	return <Block { ...props } className={ classes } ref={ ref } />;
}

export default withNextFlexBlock( forwardRef( FlexBlock ) );
