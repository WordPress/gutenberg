/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { renderAsRenderProps } from './utils';

/**
 * @template {keyof JSX.IntrinsicElements | import('react').JSXElementConstructor<any>} T
 * @typedef OwnProps
 * @property {T} [as='div'] Component to render, e.g. `"div"` or `MyComponent`.
 */

/**
 * @template {keyof JSX.IntrinsicElements | import('react').JSXElementConstructor<any>} T
 * @typedef {OwnProps<T> & import('react').ComponentProps<T>} Props
 */

/**
 * VisuallyHidden component to render text out non-visually
 * for use in devices such as a screen reader.
 *
 * @template {keyof JSX.IntrinsicElements | import('react').JSXElementConstructor<any>} T
 *
 * @param {Props<T>} props
 * @return {JSX.Element} Element
 */
function VisuallyHidden( { as = 'div', className, ...props } ) {
	return renderAsRenderProps( {
		as,
		className: classnames( 'components-visually-hidden', className ),
		...props,
	} );
}
export default VisuallyHidden;
