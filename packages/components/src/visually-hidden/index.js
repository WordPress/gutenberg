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
import { renderAsRenderProps } from './utils';
import { withNextComponent } from './next';

/**
 * @template {keyof JSX.IntrinsicElements | import('react').JSXElementConstructor<any>} T
 * @typedef OwnProps
 * @property {T} [as='div'] Component to render, e.g. `"div"` or `MyComponent`.
 */

/**
 * @template {keyof JSX.IntrinsicElements | import('react').JSXElementConstructor<any>} T
 * @typedef {OwnProps<T> & import('react').ComponentPropsWithRef<T>} Props
 */

/**
 * VisuallyHidden component to render text out non-visually
 * for use in devices such as a screen reader.
 *
 * @template {keyof JSX.IntrinsicElements | import('react').JSXElementConstructor<any>} T T
 * @param {Props<T>} props
 * @param {import('react').Ref<any>} forwardedRef
 * @return {JSX.Element} Element
 */
function VisuallyHidden( { as = 'div', className, ...props }, forwardedRef ) {
	return renderAsRenderProps( {
		as,
		className: classnames( 'components-visually-hidden', className ),
		...props,
		ref: forwardedRef,
	} );
}

export default withNextComponent( forwardRef( VisuallyHidden ) );
