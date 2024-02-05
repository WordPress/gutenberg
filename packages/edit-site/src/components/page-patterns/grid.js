/**
 * Internal dependencies
 */
import GridItem from './grid-item';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

export default function Grid( { categoryId, items, ...props } ) {
	const [ currentIndex, setCurrentIndex ] = useState( 0 );

	useEffect( () => {
		if ( ! items.length ) return;
		if ( currentIndex < items.length ) {
			const timer = setTimeout( () => {
				setCurrentIndex( currentIndex + 1 );
			}, 500 );
			return () => clearTimeout( timer );
		}
	}, [ currentIndex, items.length ] );

	if ( ! items?.length ) {
		return null;
	}

	return (
		<ul className="edit-site-patterns__grid" { ...props }>
			{ items.slice( 0, currentIndex ).map( ( item ) => (
				<GridItem
					key={ item.name }
					item={ item }
					categoryId={ categoryId }
				/>
			) ) }
		</ul>
	);
}
