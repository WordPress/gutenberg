/**
 * External dependencies
 */
import type {
	ReactElement,
	ReactNode,
	ElementType,
	HTMLAttributes,
	RefAttributes,
} from 'react';

export type ToolbarItemProps = Omit< HTMLAttributes< any >, 'children' > & {
	/**
	 * Component type that will be used to render the toolbar item.
	 */
	as?: ElementType;
	/**
	 * A function that receives the props that should be spread onto the element
	 * that will be rendered as a toolbar item. If the `as` prop is not provided,
	 * this prop will accept a ReactNode instead.
	 */
	children?:
		| ReactNode
		| ( (
				props: HTMLAttributes< any > & RefAttributes< any >
		  ) => ReactElement | null );
};
