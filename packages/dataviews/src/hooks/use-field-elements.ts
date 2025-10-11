/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { FieldElementsSource, Option } from '../types';
import resolveFieldElements from '../utils/resolve-field-elements';

type UseFieldElementsResult = {
	elements: Option[];
	isResolving: boolean;
	error?: unknown;
};

export function useFieldElements(
	source: FieldElementsSource | undefined
): UseFieldElementsResult {
	const isStaticArray = Array.isArray( source );
	const [ elements, setElements ] = useState< Option[] >(
		isStaticArray ? source : []
	);
	const [ isResolving, setIsResolving ] = useState( () =>
		source ? ! isStaticArray : false
	);
	const [ error, setError ] = useState< unknown >();
	const requestIdRef = useRef( 0 );

	useEffect( () => {
		if ( ! source ) {
			setElements( [] );
			setError( undefined );
			setIsResolving( false );
			return;
		}

		if ( Array.isArray( source ) ) {
			setElements( source );
			setError( undefined );
			setIsResolving( false );
			return;
		}

		requestIdRef.current += 1;
		const requestId = requestIdRef.current;
		let isMounted = true;

		setIsResolving( true );
		setError( undefined );

		resolveFieldElements( source )
			.then( ( result ) => {
				if ( ! isMounted || requestId !== requestIdRef.current ) {
					return;
				}

				setElements( result );
			} )
			.catch( ( err ) => {
				if ( ! isMounted || requestId !== requestIdRef.current ) {
					return;
				}

				setError( err );
				setElements( [] );
			} )
			.finally( () => {
				if ( ! isMounted || requestId !== requestIdRef.current ) {
					return;
				}

				setIsResolving( false );
			} );

		return () => {
			isMounted = false;
		};
	}, [ source ] );

	return {
		elements,
		isResolving,
		error,
	};
}
