import {
	type ElementType,
	type ComponentPropsWithoutRef,
	type HTMLAttributes,
	type Ref,
} from 'react';

type HTMLAttributesWithRef< T extends ElementType = any > =
	HTMLAttributes< T > & { ref?: Ref< T > | undefined };

type ComponentRenderFn< Props > = (
	props: Props
) => React.ReactElement< unknown >;

export type ComponentProps< E extends ElementType > = Omit<
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
		| ComponentRenderFn< HTMLAttributesWithRef >
		| React.ReactElement< Record< string, unknown > >;
};
