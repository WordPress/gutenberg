/**
 * WordPress dependencies
 */
import {
	useLayoutEffect,
	useEffect,
	useRef,
	useState,
	startTransition,
} from '@wordpress/element';
import { __experimentalHStack as HStack, Button } from '@wordpress/components';

export default function PatternsPagination( {
	patterns,
	page,
	setPage,
	getTotalPages,
} ) {
	const [ totalPages, setTotalPages ] = useState( page );
	const getTotalPagesRef = useRef( getTotalPages );
	useLayoutEffect( () => {
		getTotalPagesRef.current = getTotalPages;
	} );

	// Refetch total pages when `patterns` changes.
	// This is not a good indicator of when to refetch the total pages,
	// but the only one we have for now.
	useEffect( () => {
		const abortController = new AbortController();
		const signal = abortController.signal;
		getTotalPagesRef
			.current( { signal } )
			.then( ( pages ) => setTotalPages( pages ) )
			.catch( () => setTotalPages( 1 ) );
		return () => {
			abortController.abort();
		};
	}, [ patterns ] );

	const pages = Array.from(
		{ length: totalPages },
		( _, index ) => index + 1
	);

	return (
		<HStack spacing={ 2 } alignment="center">
			{ pages.map( ( p ) =>
				p === page ? (
					<u aria-current="page" key={ p }>
						{ p }
					</u>
				) : (
					<Button
						key={ p }
						variant="link"
						onClick={ () => {
							startTransition( () => {
								setPage( p );
							} );
						} }
					>
						{ p }
					</Button>
				)
			) }
		</HStack>
	);
}
