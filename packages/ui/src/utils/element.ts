/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';

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
 * @param render The render prop (component or element).
 * @param props  Props to pass to or merge with the element.
 * @param ref    Optional ref to attach to the element.
 * @return The rendered element.
 */
export const renderElement = < E extends React.ElementType >(
	render: RenderProp< E >,
	props: Omit< ComponentProps< E >, 'render' >,
	ref?: React.Ref<
		E extends keyof HTMLElementTagNameMap
			? HTMLElementTagNameMap[ E ]
			: Element
	>
): React.ReactElement => {
	const propsWithRef = ref ? { ...props, ref } : props;

	return typeof render === 'function'
		? render( propsWithRef )
		: cloneElement( render, propsWithRef );
};
