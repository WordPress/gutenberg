/**
 * WordPress dependencies
 */
import { debounce } from '@wordpress/compose';
import { useEffect, useState, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

import { __experimentalSanitizeBlockAttributes } from '@wordpress/blocks';

export function rendererPath(
	block: string,
	attributes: Record< string, unknown > | null = null,
	urlQueryArgs: Record< string, unknown > = {}
): string {
	return addQueryArgs( `/wp/v2/block-renderer/${ block }`, {
		context: 'edit',
		...( null !== attributes ? { attributes } : {} ),
		...urlQueryArgs,
	} );
}

export function removeBlockSupportAttributes(
	attributes: Record< string, unknown > & {
		style?: Record< string, unknown >;
	}
): Record< string, unknown > {
	const {
		backgroundColor,
		borderColor,
		fontFamily,
		fontSize,
		gradient,
		textColor,
		className,
		...restAttributes
	} = attributes;

	const {
		border,
		color,
		elements,
		shadow,
		spacing,
		typography,
		...restStyles
	} = attributes?.style || {};

	return {
		...restAttributes,
		style: restStyles,
	};
}

/**
 * Server-side render response object.
 */
export interface ServerSideRenderResponse {
	/** The current request status: 'idle', 'loading', 'success', or 'error'. */
	status: 'idle' | 'loading' | 'success' | 'error';
	/** The rendered block content (available when status is 'success'). */
	content?: string;
	/** The error message (available when status is 'error'). */
	error?: string;
}

/**
 * Configuration object for the useServerSideRender hook.
 */
export interface UseServerSideRenderArgs {
	/** The block attributes to be sent to the server for rendering. */
	attributes: Record< string, unknown >;
	/** The identifier of the block to be serverside rendered. Example: 'core/archives'. */
	block: string;
	/** Whether to remove block support attributes before sending. */
	skipBlockSupportAttributes?: boolean;
	/** The HTTP method to use ('GET' or 'POST'). Default is 'GET'. */
	httpMethod?: 'GET' | 'POST';
	/** Additional query arguments to append to the request URL. */
	urlQueryArgs?: Record< string, unknown >;
}

/**
 * A hook for server-side rendering a preview of dynamic blocks to display in the editor.
 *
 * Handles fetching server-rendered previews for blocks, managing loading states,
 * and automatically debouncing requests to prevent excessive API calls. It supports both
 * GET and POST requests, with POST requests used for larger attribute payloads.
 *
 * @example
 * Basic usage:
 *
 * ```jsx
 * import { RawHTML } from '@wordpress/element';
 * import { useServerSideRender } from '@wordpress/server-side-render';
 *
 * function MyServerSideRender( { attributes, block } ) {
 *   const { content, status, error } = useServerSideRender( {
 *     attributes,
 *     block,
 *   } );
 *
 *   if ( status === 'loading' ) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   if ( status === 'error' ) {
 *     return <div>Error: { error }</div>;
 *   }
 *
 *   return <RawHTML>{ content }</RawHTML>;
 * }
 * ```
 *
 * @param args The hook configuration object.
 *
 * @return The server-side render response object.
 */
export function useServerSideRender(
	args: UseServerSideRenderArgs
): ServerSideRenderResponse {
	const [ response, setResponse ] = useState< ServerSideRenderResponse >( {
		status: 'idle',
	} );
	const shouldDebounceRef = useRef< boolean >( false );

	const {
		attributes,
		block,
		skipBlockSupportAttributes = false,
		httpMethod = 'GET',
		urlQueryArgs,
	} = args;

	let sanitizedAttributes: Record< string, unknown > | null =
		attributes &&
		__experimentalSanitizeBlockAttributes( block, attributes );

	if ( skipBlockSupportAttributes && sanitizedAttributes ) {
		sanitizedAttributes =
			removeBlockSupportAttributes( sanitizedAttributes );
	}

	// If httpMethod is 'POST', send the attributes in the request body instead of the URL.
	// This allows sending a larger attributes object than in a GET request, where the attributes are in the URL.
	const isPostRequest = 'POST' === httpMethod;
	const urlAttributes = isPostRequest ? null : sanitizedAttributes;
	const path = rendererPath( block, urlAttributes, urlQueryArgs );
	const body = isPostRequest
		? JSON.stringify( { attributes: sanitizedAttributes ?? null } )
		: undefined;

	useEffect( () => {
		const controller = new AbortController();
		const debouncedFetch = debounce(
			function () {
				{
					setResponse( { status: 'loading' } );

					apiFetch< { rendered: string } >( {
						path,
						method: isPostRequest ? 'POST' : 'GET',
						body,
						headers: isPostRequest
							? {
									'Content-Type': 'application/json',
							  }
							: {},
						signal: controller.signal,
					} )
						.then( ( res ) => {
							setResponse( {
								status: 'success',
								content: res ? res.rendered : '',
							} );
						} )
						.catch( ( error: unknown ) => {
							// The request was aborted, do not update the response.
							if (
								error instanceof Error &&
								error.name === 'AbortError'
							) {
								return;
							}

							setResponse( {
								status: 'error',
								error:
									error instanceof Error
										? error.message
										: String( error ),
							} );
						} )
						.finally( () => {
							// Debounce requests after first fetch.
							shouldDebounceRef.current = true;
						} );
				}
			},
			shouldDebounceRef.current ? 500 : 0
		);

		debouncedFetch();

		return () => {
			controller.abort();
			debouncedFetch.cancel();
		};
	}, [ path, isPostRequest, body ] );

	return response;
}
