import type {
	ComponentProps,
	ComponentPropsWithoutRef,
	ElementType,
	ReactNode,
} from 'react';
import type { Composite } from '@wordpress/components';

/**
 * Props of `InserterListbox`.
 */
export interface InserterListboxProps {
	children?: ReactNode;
}

/**
 * Props of an inserter listbox item, rendered as a button unless `as` is set.
 */
export type InserterListboxItemProps = Omit<
	ComponentProps< typeof Composite.Item >,
	'children' | 'render'
> & {
	isFirst?: boolean;
	as?: ElementType;
	children?:
		ReactNode | ( ( props: Record< string, unknown > ) => ReactNode );
};

/**
 * Props of the fragment the listbox composite renders as.
 */
export interface InserterListBoxWrapperProps {
	key?: string;
	children?: ReactNode;
}

/**
 * Props of an inserter listbox row.
 */
export type InserterListboxRowProps = ComponentPropsWithoutRef<
	typeof Composite.Group
>;
