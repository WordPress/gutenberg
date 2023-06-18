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

export interface ToolbarItemProps
	extends Omit< HTMLAttributes< any >, 'children' > {
	/**
	 * Component type that will be used to render the toolbar item.
	 */
	as?: ElementType;
	/**
	 * Children render prop that will be used to render the toolbar item.
	 */
	children?:
		| ReactNode
		| ( (
				props: HTMLAttributes< any > & RefAttributes< any >
		  ) => ReactElement | null );
}
