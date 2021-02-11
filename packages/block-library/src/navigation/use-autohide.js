/**
 * External dependencies
 */
import { debounce } from 'lodash';
/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

export default function useAutohide( clientId, innerBlocks, ref ) {
	const [ state, setState ] = useState( {
		isWrapping: false,
		visibilityMap: [],
	} );

	const handleResize = debounce( ( nav ) => {
		const { bottom } = nav.getBoundingClientRect();

		const items = Array.from( nav.childNodes );
		const visibilityMap = items.reduce( ( result, el ) => {
			const isHidden = el.getBoundingClientRect().y >= bottom;
			const [ , blockId ] = el.id.split( 'block-' );

			return {
				...result,
				[ blockId ]: isHidden,
			};
		}, {} );
		const hasWrappedElements = Object.values( visibilityMap ).some(
			( item ) => item.isHidden
		);

		setState( {
			isWrapping: hasWrappedElements,
			visibilityMap,
		} );
	}, 100 );

	useEffect( () => {
		const element = ref.current;

		if ( ! element ) {
			return;
		}

		const { ownerDocument } = element;

		window.addEventListener(
			'resize',
			() => handleResize( element ),
			false
		);

		handleResize( element );

		return () => {
			window.removeEventListener( 'resize', () =>
				handleResize( element )
			);
		};
	}, [ innerBlocks ] );

	const updatedBlocks = innerBlocks.map( ( block ) => ( {
		...block,
		isHidden: state.visibilityMap[ block.clientId ],
	} ) );

	console.log( updatedBlocks );

	useDispatch( ( dispatch ) =>
		dispatch( 'core/block-editor' ).replaceInnerBlocks(
			clientId,
			updatedBlocks,
			true
		)
	);

	return state;
}
