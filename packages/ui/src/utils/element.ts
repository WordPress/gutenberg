/**
 * WordPress dependencies
 */
import { cloneElement, createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ComponentProps } from './types';

type RenderProp< E extends React.ElementType > = NonNullable<
	ComponentProps< E >[ 'render' ]
>;

/**
 * Renders an element from a render prop (a component or an element), with
 * merged props and ref.
 *
 * @param options                Render options.
 * @param options.render         The render prop (component or element).
 * @param options.defaultTagName The default tag name to use if no render prop
 *                               is provided.
 * @param options.props          Props to pass to or merge with the element.
 * @param options.ref            Optional ref to attach to the element.
 * @return The rendered element.
 */
export const renderElement = < E extends React.ElementType >( {
	render,
	defaultTagName = 'div',
	props,
	ref,
}: {
	render?: RenderProp< E >;
	defaultTagName?: keyof JSX.IntrinsicElements;
	props: Omit< ComponentProps< E >, 'render' >;
	ref?: React.Ref<
		E extends keyof HTMLElementTagNameMap
			? HTMLElementTagNameMap[ E ]
			: Element
	>;
} ): React.ReactElement => {
	const propsWithRef = ref ? { ...props, ref } : props;

	if ( render === undefined ) {
		return createElement( defaultTagName, propsWithRef );
	} else if ( typeof render === 'function' ) {
		return render( propsWithRef );
	}

	return cloneElement( render, propsWithRef );
};
