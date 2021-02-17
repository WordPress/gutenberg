/**
 * External dependencies
 */
import { debounce } from 'lodash';
/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

export default function useAutohide( clientId, innerBlocks, ref ) {
	const [ state, setState ] = useState( {
		isWrapping: false,
		visibilityMap: [],
	} );

	const getRef = () => ref;

	const handleResize = debounce( () => {
		const { current: nav } = getRef();
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
		const isWrapping = Object.values( visibilityMap ).some(
			( item ) => item.isHidden
		);

		setState( {
			isWrapping,
			visibilityMap,
		} );
	}, 100 );

	useEffect( () => {
		window.addEventListener( 'resize', handleResize );

		return () => window.removeEvenetListener( 'resize', handleResize );
	}, [] );

	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );

	/*
		Memoize innerBlocks value in order to avoid an infinite look of
		replacing innerBlocks and calling replaceInnerBlocks again on the new blocks.
	*/
	const memoizedInnerBlocks = useMemo( () => innerBlocks, [] );

	useMemo( () => {
		const updatedBlocks = memoizedInnerBlocks.map( ( block ) => ( {
			...block,
			isHidden: state.visibilityMap[ block.clientId ],
		} ) );

		replaceInnerBlocks( clientId, updatedBlocks, true );
	}, [ state.visibilityMap, memoizedInnerBlocks ] );

	return state;
}
