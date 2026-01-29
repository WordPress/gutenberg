import type {
	ElementType,
	ComponentPropsWithoutRef,
	HTMLAttributes,
	ReactElement,
	Ref,
} from 'react';

type HTMLAttributesWithRef< T extends ElementType = any > =
	HTMLAttributes< T > & { ref?: Ref< T > | undefined };

type ComponentRenderFn< Props, State > = (
	props: Props,
	state: State
) => ReactElement< unknown >;

export type ComponentProps< E extends ElementType, S = unknown > = Omit<
	ComponentPropsWithoutRef< E >,
	'className' | 'children' | 'render'
> & {
	/**
	 * CSS class name to apply to the component.
	 */
	className?: string;

	/**
	 * Replaces the component's default HTML element using a given React
	 * element, or a function that returns a React element.
	 */
	render?:
		| ComponentRenderFn< HTMLAttributesWithRef, S >
		| ReactElement< Record< string, unknown > >;
};
