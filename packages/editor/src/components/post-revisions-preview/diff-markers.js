/**
 * WordPress dependencies
 */
import {
	useState,
	useMemo,
	useRef,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { useRefEffect, useMergeRefs } from '@wordpress/compose';
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

function calculatePosition( el ) {
	if ( ! el ) {
		return null;
	}
	const doc = el.ownerDocument;
	const scrollHeight = doc.documentElement.scrollHeight;
	const rect = el.getBoundingClientRect();
	const scrollTop = doc.documentElement.scrollTop;
	const top = rect.top + scrollTop;
	return {
		top: ( top / scrollHeight ) * 100,
		height: ( rect.height / scrollHeight ) * 100,
	};
}

/**
 * Button component for a single diff marker.
 *
 * @param {Object}   props           Component props.
 * @param {string}   props.clientId  The block client ID.
 * @param {string}   props.status    The diff status (added/removed/modified).
 * @param {Function} props.subscribe Function to subscribe to position updates.
 * @return {JSX.Element|null} The diff marker button or null if position not calculated.
 */
function DiffMarkerButton( { clientId, status, subscribe } ) {
	const blockRef = useRef();
	useBlockElementRef( clientId, blockRef );
	const [ position, setPosition ] = useState( () =>
		calculatePosition( blockRef.current )
	);

	useEffect( () => {
		return subscribe( () => {
			setPosition( calculatePosition( blockRef.current ) );
		} );
	}, [ subscribe ] );

	useEffect( () => {
		setPosition( calculatePosition( blockRef.current ) );
	}, [ status ] );

	if ( ! position ) {
		return null;
	}

	return (
		<button
			className={ `revision-diff-marker is-${ status }` }
			style={ {
				top: `${ position.top }%`,
				height: `${ Math.max( position.height, 0.5 ) }%`,
			} }
			onClick={ () => blockRef.current?.focus() }
			aria-label={ STATUS_LABELS[ status ] }
		/>
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
	const [ isMounted, setIsMounted ] = useState( false );
	const subscribersRef = useRef( new Set() );
	const blocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks(),
		[]
	);
	const diffBlocks = useMemo( () => collectDiffBlocks( blocks ), [ blocks ] );
	const subscribe = useCallback( ( callback ) => {
		subscribersRef.current.add( callback );
		return () => subscribersRef.current.delete( callback );
	}, [] );
	const contentRef = useRefEffect( ( element ) => {
		const { ownerDocument } = element;
		const { defaultView } = ownerDocument;
		const resizeObserver = new defaultView.ResizeObserver( () => {
			subscribersRef.current.forEach( ( cb ) => cb() );
		} );
		resizeObserver.observe( ownerDocument.body );
		return () => {
			resizeObserver.disconnect();
		};
	}, [] );
	return [
		useMergeRefs( [ contentRef, setIsMounted ] ),
		<div
			key="diff-markers"
			className="revision-diff-markers"
			role="navigation"
			aria-label={ __( 'Diff markers' ) }
		>
			{ isMounted &&
				diffBlocks.map( ( { clientId, status } ) => (
					<DiffMarkerButton
						key={ clientId }
						clientId={ clientId }
						status={ status }
						subscribe={ subscribe }
					/>
				) ) }
		</div>,
	];
}
