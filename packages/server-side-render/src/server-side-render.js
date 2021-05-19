/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDebounce, usePrevious } from '@wordpress/compose';
import { RawHTML, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { Placeholder, Spinner } from '@wordpress/components';
import { __experimentalSanitizeBlockAttributes } from '@wordpress/blocks';

export function rendererPath( block, attributes = null, urlQueryArgs = {} ) {
	return addQueryArgs( `/wp/v2/block-renderer/${ block }`, {
		context: 'edit',
		...( null !== attributes ? { attributes } : {} ),
		...urlQueryArgs,
	} );
}

function DefaultEmptyResponsePlaceholder( { className } ) {
	return (
		<Placeholder className={ className }>
			{ __( 'Block rendered as empty.' ) }
		</Placeholder>
	);
}

function DefaultErrorResponsePlaceholder( { response, className } ) {
	const errorMessage = sprintf(
		// translators: %s: error message describing the problem
		__( 'Error loading block: %s' ),
		response.errorMsg
	);
	return <Placeholder className={ className }>{ errorMessage }</Placeholder>;
}

function DefaultLoadingResponsePlaceholder( { className } ) {
	return (
		<Placeholder className={ className }>
			<Spinner />
		</Placeholder>
	);
}

export default function ServerSideRender( props ) {
	const {
		attributes,
		block,
		className,
		httpMethod = 'GET',
		urlQueryArgs,
		EmptyResponsePlaceholder = DefaultEmptyResponsePlaceholder,
		ErrorResponsePlaceholder = DefaultErrorResponsePlaceholder,
		LoadingResponsePlaceholder = DefaultLoadingResponsePlaceholder,
	} = props;

	const isMountedRef = useRef( true );
	const fetchRequestRef = useRef();
	const [ response, setResponse ] = useState( null );
	const prevProps = usePrevious( props );

	function fetchData() {
		if ( ! isMountedRef.current ) {
			return;
		}
		if ( null !== response ) {
			setResponse( null );
		}

		const sanitizedAttributes =
			attributes &&
			__experimentalSanitizeBlockAttributes( block, attributes );

		// If httpMethod is 'POST', send the attributes in the request body instead of the URL.
		// This allows sending a larger attributes object than in a GET request, where the attributes are in the URL.
		const isPostRequest = 'POST' === httpMethod;
		const urlAttributes = isPostRequest
			? null
			: sanitizedAttributes ?? null;
		const path = rendererPath( block, urlAttributes, urlQueryArgs );
		const data = isPostRequest
			? { attributes: sanitizedAttributes ?? null }
			: null;

		// Store the latest fetch request so that when we process it, we can
		// check if it is the current request, to avoid race conditions on slow networks.
		const fetchRequest = ( fetchRequestRef.current = apiFetch( {
			path,
			data,
			method: isPostRequest ? 'POST' : 'GET',
		} )
			.then( ( fetchResponse ) => {
				if (
					isMountedRef.current &&
					fetchRequest === fetchRequestRef.current &&
					fetchResponse
				) {
					setResponse( fetchResponse.rendered );
				}
			} )
			.catch( ( error ) => {
				if (
					isMountedRef.current &&
					fetchRequest === fetchRequestRef.current
				) {
					setResponse( {
						error: true,
						errorMsg: error.message,
					} );
				}
			} ) );

		return fetchRequest;
	}

	const debouncedFetchData = useDebounce( fetchData, 500 );

	// When the component unmounts, set isMountedRef to false. This will
	// let the async fetch callbacks know when to stop.
	useEffect(
		() => () => {
			isMountedRef.current = false;
		},
		[]
	);

	useEffect( () => {
		// Don't debounce the first fetch. This ensures that the first render
		// shows data as soon as possible
		if ( prevProps === undefined ) {
			fetchData();
		} else if ( ! isEqual( prevProps, props ) ) {
			debouncedFetchData();
		}
	} );

	if ( response === '' ) {
		return <EmptyResponsePlaceholder { ...props } />;
	} else if ( ! response ) {
		return <LoadingResponsePlaceholder { ...props } />;
	} else if ( response.error ) {
		return <ErrorResponsePlaceholder response={ response } { ...props } />;
	}

	return <RawHTML className={ className }>{ response }</RawHTML>;
}
