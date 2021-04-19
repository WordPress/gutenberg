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

/**
 * @typedef OwnProps
 * @property {import('react').ElementType} [as] Emotion's As prop.
 */

/**
 * @typedef {OwnProps & import('react').HTMLProps<HTMLDivElement> & import('react').RefAttributes<HTMLDivElement>} Props
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
