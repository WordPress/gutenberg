/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

function FontsGrid( { title, children, pageSize = 32 } ) {
	const [ lastItem, setLastItem ] = useState( null );
	const [ page, setPage ] = useState( 1 );
	const itemsLimit = page * pageSize;
	const items = children.slice( 0, itemsLimit );

	useEffect( () => {
		if ( lastItem ) {
			const observer = new window.IntersectionObserver( ( [ entry ] ) => {
				if ( entry.isIntersecting ) {
					setPage( ( prevPage ) => prevPage + 1 );
				}
			} );

			observer.observe( lastItem );

			return () => observer.disconnect();
		}
	}, [ lastItem ] );

	return (
		<div className="font-library-modal__fonts-grid">
			<VStack spacing={ 0 }>
				{ title && (
					<>
						<Text className="font-library-modal__subtitle">
							{ title }
						</Text>
						<Spacer margin={ 2 } />
					</>
				) }
				<div className="font-library-modal__fonts-grid__main">
					{ items.map( ( child, i ) => {
						if ( i === itemsLimit - 1 ) {
							return <div ref={ setLastItem }>{ child }</div>;
						}
						return child;
					} ) }
				</div>
			</VStack>
		</div>
	);
}

export default FontsGrid;
