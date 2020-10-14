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
 * @typedef Props
 * @property {T} [as='div'] Component to render
 */

/**
 * VisuallyHidden component to render text out non-visually
 * for use in devices such as a screen reader.
 *
 * @template {keyof JSX.IntrinsicElements | import('react').JSXElementConstructor<any>} T
 *
 * @param {Props<T> & import('react').ComponentProps<T>} props  A tag or component to render.
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
