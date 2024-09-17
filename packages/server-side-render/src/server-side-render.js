/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

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

const EMPTY_OBJECT = {};

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

	const { border, color, elements, spacing, typography, ...restStyles } =
		attributes?.style || EMPTY_OBJECT;

	return {
		...restAttributes,
		style: restStyles,
	};
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

function DefaultLoadingResponsePlaceholder( { children, showLoader } ) {
	return (
		<div style={ { position: 'relative' } }>
			{ showLoader && (
				<div
					style={ {
						position: 'absolute',
						top: '50%',
						left: '50%',
						marginTop: '-9px',
						marginLeft: '-9px',
					} }
				>
					<Spinner />
				</div>
			) }
			<div style={ { opacity: showLoader ? '0.3' : 1 } }>
				{ children }
			</div>
		</div>
	);
}

export default function ServerSideRender( props ) {
	const {
		attributes,
		block,
		className,
		httpMethod = 'GET',
		urlQueryArgs,
		skipBlockSupportAttributes = false,
		EmptyResponsePlaceholder = DefaultEmptyResponsePlaceholder,
		ErrorResponsePlaceholder = DefaultErrorResponsePlaceholder,
		LoadingResponsePlaceholder = DefaultLoadingResponsePlaceholder,
	} = props;

	const isMountedRef = useRef( false );
	const [ showLoader, setShowLoader ] = useState( false );
	const fetchRequestRef = useRef();
	const [ response, setResponse ] = useState( null );
	const prevProps = usePrevious( props );
	const [ isLoading, setIsLoading ] = useState( false );

	function fetchData() {
		if ( ! isMountedRef.current ) {
			return;
		}

		setIsLoading( true );

		// Schedule showing the Spinner after 1 second.
		const timeout = setTimeout( () => {
			setShowLoader( true );
		}, 1000 );

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
			} )
			.finally( () => {
				if (
					isMountedRef.current &&
					fetchRequest === fetchRequestRef.current
				) {
					setIsLoading( false );
					// Cancel the timeout to show the Spinner.
					setShowLoader( false );
					clearTimeout( timeout );
				}
			} ) );

		return fetchRequest;
	}

	const debouncedFetchData = useDebounce( fetchData, 500 );

	// When the component unmounts, set isMountedRef to false. This will
	// let the async fetch callbacks know when to stop.
	useEffect( () => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, [] );

	useEffect( () => {
		// Don't debounce the first fetch. This ensures that the first render
		// shows data as soon as possible.
		if ( prevProps === undefined ) {
			fetchData();
		} else if ( ! fastDeepEqual( prevProps, props ) ) {
			debouncedFetchData();
		}
	} );

	const hasResponse = !! response;
	const hasEmptyResponse = response === '';
	const hasError = response?.error;

	if ( isLoading ) {
		return (
			<LoadingResponsePlaceholder { ...props } showLoader={ showLoader }>
				{ hasResponse && (
					<RawHTML className={ className }>{ response }</RawHTML>
				) }
			</LoadingResponsePlaceholder>
		);
	}

	if ( hasEmptyResponse || ! hasResponse ) {
		return <EmptyResponsePlaceholder { ...props } />;
	}

	if ( hasError ) {
		return <ErrorResponsePlaceholder response={ response } { ...props } />;
	}

	return <RawHTML className={ className }>{ response }</RawHTML>;
}
