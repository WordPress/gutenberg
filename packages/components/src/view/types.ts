/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type ViewProps = {
	/** The HTML element or React component to render the component as. */
	as?: React.ElementType | keyof JSX.IntrinsicElements;
	children?: ReactNode;
} & Omit< Record< string, unknown >, 'as' | 'children' >;
