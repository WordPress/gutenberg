/**
 * WordPress dependencies
 */
import {
	__unstableComposite as Composite,
	__unstableUseCompositeState as useCompositeState,
	Button,
} from '@wordpress/components';
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import GridItem from './grid-item';

const PAGE_SIZE = 100;

export default function Grid( { categoryId, items, ...props } ) {
	const composite = useCompositeState( { orientation: 'vertical' } );
	const [ page, setPage ] = useState( 1 );
	const [ nextFocusIndex, setNextFocusIndex ] = useState( -1 );
	const gridRef = useRef();

	useEffect( () => {
		if ( gridRef.current && nextFocusIndex >= 0 ) {
			const nextFocusPattern =
				gridRef.current.querySelectorAll( '[role="option"]' )[
					nextFocusIndex
				];
			nextFocusPattern?.focus();
		}
	}, [ nextFocusIndex ] );

	if ( ! items?.length ) {
		return null;
	}

	const maxCount = page * PAGE_SIZE;
	const list = items.slice( 0, maxCount );

	return (
		<>
			<Composite
				{ ...composite }
				role="listbox"
				className="edit-site-patterns__grid"
				{ ...props }
				ref={ gridRef }
			>
				{ list.map( ( item ) => (
					<GridItem
						key={ item.name }
						item={ item }
						categoryId={ categoryId }
						composite={ composite }
					/>
				) ) }
			</Composite>
			{ items.length >= maxCount && (
				<Button
					variant="primary"
					onClick={ () => {
						setPage( ( prevPage ) => prevPage + 1 );
						setNextFocusIndex( maxCount );
					} }
				>
					{ __( 'Load more' ) }
				</Button>
			) }
		</>
	);
}
