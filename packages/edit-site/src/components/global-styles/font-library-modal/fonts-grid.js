/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontCard from './font-card';

const PAGE_SIZE = 32;

function FontsGrid( { title, fonts, onChange } ) {
	const [ lastItem, setLastItem ] = useState( null );
	const [ page, setPage ] = useState( 1 );
	const itemsLimit = page * PAGE_SIZE;

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
					{ fonts.slice( 0, itemsLimit ).map( ( font, i ) => (
						<FontCard
							key={ i }
							font={ font }
							ref={
								i === itemsLimit - 1 ? setLastItem : undefined
							}
							onChange={ onChange }
						/>
					) ) }
				</div>
			</VStack>
		</div>
	);
}

export default FontsGrid;
