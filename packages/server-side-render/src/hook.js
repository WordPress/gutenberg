/**
 * WordPress dependencies
 */
import { debounce } from '@wordpress/compose';
import { useEffect, useState, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __experimentalSanitizeBlockAttributes } from '@wordpress/blocks';

export function rendererPath( block, attributes = null, urlQueryArgs = {} ) {
	return addQueryArgs( `/wp/v2/block-renderer/${ block }`, {
		context: 'edit',
		...( null !== attributes ? { attributes } : {} ),
		...urlQueryArgs,
	} );
}

export function removeBlockSupportAttributes( attributes ) {
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
 * @typedef {Object} ServerSideRenderResponse
 * @property {string} status    - The current request status: 'idle', 'loading', 'success', or 'error'.
 * @property {string} [content] - The rendered block content (available when status is 'success').
 * @property {string} [error]   - The error message (available when status is 'error').
 */

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
 * @param {Object}  args                                    The hook configuration object.
 * @param {Object}  args.attributes                         The block attributes to be sent to the server for rendering.
 * @param {string}  args.block                              The identifier of the block to be serverside rendered. Example: 'core/archives'.
 * @param {boolean} [args.skipBlockSupportAttributes=false] Whether to remove block support attributes before sending.
 * @param {string}  [args.httpMethod='GET']                 The HTTP method to use ('GET' or 'POST'). Default is 'GET'.
 * @param {Object}  [args.urlQueryArgs]                     Additional query arguments to append to the request URL.
 *
 * @return {ServerSideRenderResponse} The server-side render response object.
 */
export function useServerSideRender( args ) {
	const [ response, setResponse ] = useState( { status: 'idle' } );
	const shouldDebounceRef = useRef( false );

	const {
		attributes,
		block,
		skipBlockSupportAttributes = false,
		httpMethod = 'GET',
		urlQueryArgs,
	} = args;

	let sanitizedAttributes =
		attributes &&
		__experimentalSanitizeBlockAttributes( block, attributes );

	if ( skipBlockSupportAttributes ) {
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

					apiFetch( {
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
						.catch( ( error ) => {
							// The request was aborted, do not update the response.
							if ( error.name === 'AbortError' ) {
								return;
							}

							setResponse( {
								status: 'error',
								error: error.message,
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
