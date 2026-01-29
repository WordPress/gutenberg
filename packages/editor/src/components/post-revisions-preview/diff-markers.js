/**
 * WordPress dependencies
 */
import { useState, useMemo, useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useBlockElementRef } = unlock( blockEditorPrivateApis );

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

const STATUS_LABELS = {
	added: __( 'Go to added block' ),
	removed: __( 'Go to removed block' ),
	modified: __( 'Go to modified block' ),
};

/**
 * Button component for a single diff marker.
 * Uses useBlockElementRef to focus the block element on click.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId The block client ID.
 * @param {string} props.status   The diff status (added/removed/modified).
 * @param {Object} props.position Position data with top and height percentages.
 * @return {JSX.Element} The diff marker button.
 */
function DiffMarkerButton( { clientId, status, position } ) {
	const ref = useRef();
	useBlockElementRef( clientId, ref );

	return (
		<button
			className={ `revision-diff-marker is-${ status }` }
			style={ {
				top: `${ position.top }%`,
				height: `${ Math.max( position.height, 0.5 ) }%`,
			} }
			onClick={ () => ref.current?.focus() }
			aria-label={ STATUS_LABELS[ status ] }
		/>
	);
}

/**
 * Component that renders diff markers in a scrollbar-style strip.
 *
 * @param {Object} props            Component props.
 * @param {Object} props.positions  Map of clientId to position data.
 * @param {Array}  props.diffBlocks Blocks with diff status.
 * @return {JSX.Element} The diff markers component.
 */
function DiffMarkers( { positions, diffBlocks } ) {
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
					<DiffMarkerButton
						key={ clientId }
						clientId={ clientId }
						status={ status }
						position={ pos }
					/>
				);
			} ) }
		</div>
	);
}

/**
 * Hook that provides diff markers functionality.
 * Returns a ref callback for the content element and a DiffMarkers component.
 * Must be used inside a BlockEditorProvider context.
 *
 * @return {Array} Tuple of [contentRef, DiffMarkersComponent].
 */
export function useDiffMarkers() {
	const [ positions, setPositions ] = useState( {} );
	const blocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks(),
		[]
	);

	const diffBlocks = useMemo( () => collectDiffBlocks( blocks ), [ blocks ] );

	// Ref effect to set up ResizeObserver when content element is available
	const contentRef = useRefEffect(
		( element ) => {
			const doc = element.ownerDocument;

			const updatePositions = () => {
				const scrollHeight = doc.documentElement.scrollHeight;
				if ( scrollHeight === 0 ) {
					return;
				}

				const newPositions = {};
				for ( const { clientId } of diffBlocks ) {
					const el = doc.querySelector(
						`[data-block="${ clientId }"]`
					);
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
		},
		[ diffBlocks ]
	);

	return [
		contentRef,
		<DiffMarkers
			key="diff-markers"
			positions={ positions }
			diffBlocks={ diffBlocks }
		/>,
	];
}
