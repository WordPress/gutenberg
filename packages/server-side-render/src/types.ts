/**
 * WordPress dependencies
 */
import type React from 'react';

/**
 * Internal dependencies
 */
import type { UseServerSideRenderArgs } from './hook';

export interface PlaceholderProps {
	className?: string;
}

export interface ErrorPlaceholderProps extends PlaceholderProps {
	message?: string;
}

export interface LoadingPlaceholderProps {
	children?: React.ReactNode;
}

export interface ServerSideRenderProps extends UseServerSideRenderArgs {
	className?: string;
	EmptyResponsePlaceholder?: React.ComponentType< PlaceholderProps >;
	ErrorResponsePlaceholder?: React.ComponentType< ErrorPlaceholderProps >;
	LoadingResponsePlaceholder?: React.ComponentType< LoadingPlaceholderProps >;
}

export interface ServerSideRenderWithPostIdProps
	extends Omit< ServerSideRenderProps, 'urlQueryArgs' > {
	urlQueryArgs?: Record< string, unknown >;
}
