/**
 * WordPress dependencies
 */
import type React from 'react';

/**
 * Internal dependencies
 */
import type { UseServerSideRenderArgs } from './hook';

export interface PlaceholderProps {
	/** Additional classes to apply to the wrapper element. */
	className?: string;
}

export interface ErrorPlaceholderProps extends PlaceholderProps {
	/** Error message describing the problem. */
	message?: string;
}

export interface LoadingPlaceholderProps {
	children?: React.ReactNode;
}

export interface ServerSideRenderProps extends UseServerSideRenderArgs {
	/** Additional classes to apply to the wrapper element. */
	className?: string;
	/** Component rendered when the API response is empty. */
	EmptyResponsePlaceholder?: React.ComponentType< PlaceholderProps >;
	/** Component rendered when the API response is an error. */
	ErrorResponsePlaceholder?: React.ComponentType< ErrorPlaceholderProps >;
	/** Component rendered while the API request is loading. */
	LoadingResponsePlaceholder?: React.ComponentType< LoadingPlaceholderProps >;
}

export interface ServerSideRenderWithPostIdProps
	extends Omit< ServerSideRenderProps, 'urlQueryArgs' > {
	/** Additional query arguments to append to the request URL. */
	urlQueryArgs?: Record< string, unknown >;
}
