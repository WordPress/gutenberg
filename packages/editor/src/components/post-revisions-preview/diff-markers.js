/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

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
 * Rendered outside the iframe, receives the iframe body element.
 *
 * @param {Object}  props                Component props.
 * @param {Element} props.contentElement The iframe body element.
 * @return {JSX.Element} The diff markers component.
 */
export default function DiffMarkers( { contentElement } ) {
	const [ positions, setPositions ] = useState( {} );
	const blocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks(),
		[]
	);

	const diffBlocks = useMemo( () => collectDiffBlocks( blocks ), [ blocks ] );

	// Set up ResizeObserver and calculate positions when content element is available
	useEffect( () => {
		if ( ! contentElement ) {
			return;
		}

		const doc = contentElement.ownerDocument;

		const updatePositions = () => {
			const scrollHeight = doc.documentElement.scrollHeight;
			if ( scrollHeight === 0 ) {
				return;
			}

			const newPositions = {};
			for ( const { clientId } of diffBlocks ) {
				const el = doc.querySelector( `[data-block="${ clientId }"]` );
				if ( el ) {
					const rect = el.getBoundingClientRect();
					const scrollTop = doc.documentElement.scrollTop;
					const top = rect.top + scrollTop;
					newPositions[ clientId ] = {
						top: ( top / scrollHeight ) * 100,
						height: ( rect.height / scrollHeight ) * 100,
					};
				}
			}

			setPositions( newPositions );
		};

		// Initial calculation
		updatePositions();

		// ResizeObserver for content size changes
		const { ResizeObserver } = doc.defaultView;
		const resizeObserver = new ResizeObserver( updatePositions );
		resizeObserver.observe( doc.body );

		return () => {
			resizeObserver.disconnect();
		};
	}, [ contentElement, diffBlocks ] );

	const scrollToBlock = ( clientId ) => {
		const doc = contentElement?.ownerDocument;
		if ( ! doc ) {
			return;
		}
		const block = doc.querySelector( `[data-block="${ clientId }"]` );
		block?.scrollIntoView( { behavior: 'smooth', block: 'center' } );
	};

	const statusLabels = {
		added: __( 'Scroll to added block' ),
		removed: __( 'Scroll to removed block' ),
		modified: __( 'Scroll to modified block' ),
	};

	return (
		<div
			className="revision-diff-markers"
			role="navigation"
			aria-label={ __( 'Diff markers' ) }
		>
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
						aria-label={ statusLabels[ status ] }
					/>
				);
			} ) }
		</div>
	);
}
