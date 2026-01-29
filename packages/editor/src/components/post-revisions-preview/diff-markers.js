/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Recursively collect blocks with diff status.
 *
 * @param {Array} blocks The blocks to search.
 * @return {Array} Blocks with __revisionDiffStatus.
 */
function collectDiffBlocks( blocks ) {
	const result = [];
	for ( const block of blocks ) {
		if ( block.__revisionDiffStatus ) {
			result.push( {
				clientId: block.clientId,
				status: block.__revisionDiffStatus,
			} );
		}
		if ( block.innerBlocks?.length ) {
			result.push( ...collectDiffBlocks( block.innerBlocks ) );
		}
	}
	return result;
}

/**
 * Component that renders diff markers in a scrollbar-style strip.
 * Shows colored ticks for added/removed/modified blocks.
 * Must be rendered inside the editor iframe.
 *
 * @return {JSX.Element} The diff markers component.
 */
export default function DiffMarkers() {
	const [ positions, setPositions ] = useState( {} );
	const [ ownerDoc, setOwnerDoc ] = useState( null );
	const blocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks(),
		[]
	);

	const diffBlocks = useMemo( () => collectDiffBlocks( blocks ), [ blocks ] );

	// Calculate positions from DOM
	const updatePositions = useCallback( () => {
		if ( ! ownerDoc ) {
			return;
		}

		const scrollHeight = ownerDoc.documentElement.scrollHeight;
		if ( scrollHeight === 0 ) {
			return;
		}

		const newPositions = {};
		for ( const { clientId } of diffBlocks ) {
			const el = ownerDoc.querySelector( `[data-block="${ clientId }"]` );
			if ( el ) {
				const rect = el.getBoundingClientRect();
				const scrollTop = ownerDoc.documentElement.scrollTop;
				const top = rect.top + scrollTop;
				newPositions[ clientId ] = {
					top: ( top / scrollHeight ) * 100,
					height: ( rect.height / scrollHeight ) * 100,
				};
			}
		}

		setPositions( newPositions );
	}, [ diffBlocks, ownerDoc ] );

	// Get ownerDocument and set up observers
	const containerRef = useRefEffect(
		( element ) => {
			const doc = element.ownerDocument;
			setOwnerDoc( doc );

			// Initial calculation after blocks render
			const timeoutId = setTimeout( updatePositions, 100 );

			// ResizeObserver for content size changes
			const resizeObserver = new window.ResizeObserver( updatePositions );
			resizeObserver.observe( doc.body );

			return () => {
				clearTimeout( timeoutId );
				resizeObserver.disconnect();
			};
		},
		[ updatePositions ]
	);

	const scrollToBlock = ( clientId ) => {
		if ( ! ownerDoc ) {
			return;
		}
		const block = ownerDoc.querySelector( `[data-block="${ clientId }"]` );
		block?.scrollIntoView( { behavior: 'smooth', block: 'center' } );
	};

	return (
		<div ref={ containerRef } className="revision-diff-markers">
			{ diffBlocks.map( ( { clientId, status } ) => {
				const pos = positions[ clientId ];
				if ( ! pos ) {
					return null;
				}
				return (
					<button
						key={ clientId }
						className={ `revision-diff-marker is-${ status }` }
						style={ {
							top: `${ pos.top }%`,
							height: `${ Math.max( pos.height, 0.5 ) }%`,
						} }
						onClick={ () => scrollToBlock( clientId ) }
						aria-label={ `Scroll to ${ status } block` }
					/>
				);
			} ) }
		</div>
	);
}
