/**
 * WordPress dependencies
 */
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import {
	DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS,
	DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES,
	getDistributedEditingComparablePostContent,
	getDistributedEditingPresenceRosterStateForSessionState,
	getDistributedEditingSelectionPresenceMapping,
} from '../../store/distributed-editing';

const { BlockCanvasCover } = unlock( blockEditorPrivateApis );

const SELECTION_COLORS = Object.freeze( [
	'#007c89',
	'#3858e9',
	'#8a5a00',
	'#b32d2e',
] );

function getSelectionEntries( sessionState ) {
	return getDistributedEditingPresenceRosterStateForSessionState(
		sessionState
	).entries.filter(
		( entry ) =>
			entry.relationship !== 'current_user_current_tab' &&
			entry.selectionState?.available &&
			entry.selectionState.kind !== 'unsupported_surface'
	);
}

function getEntryKey( entry ) {
	const selectionState = entry.selectionState || {};

	return [
		entry.key,
		selectionState.kind,
		selectionState.isCollapsed ? 'collapsed' : 'range',
		selectionState.anchor?.blockPath?.join( '.' ) || '',
		selectionState.anchor?.blockUid || '',
		selectionState.anchor?.attributeKey || '',
		selectionState.anchor?.offset ?? '',
		selectionState.focus?.blockPath?.join( '.' ) || '',
		selectionState.focus?.blockUid || '',
		selectionState.focus?.attributeKey || '',
		selectionState.focus?.offset ?? '',
		selectionState.baseVersion || '',
		selectionState.baseStateHash || '',
		selectionState.selectionSourceStatus || '',
	].join( ':' );
}

function getBlockClientIdAtPath( blockEditorSelect, blockPath ) {
	if (
		! Array.isArray( blockPath ) ||
		typeof blockEditorSelect?.getBlockOrder !== 'function'
	) {
		return null;
	}

	let rootClientId;
	let clientId = null;

	for ( const index of blockPath ) {
		const blockOrder = blockEditorSelect.getBlockOrder( rootClientId );

		if ( ! Array.isArray( blockOrder ) || ! blockOrder[ index ] ) {
			return null;
		}

		clientId = blockOrder[ index ];
		rootClientId = clientId;
	}

	return clientId;
}

function getBlockClientIdsInPathSpan(
	blockEditorSelect,
	anchorBlockPath,
	focusBlockPath
) {
	if (
		! Array.isArray( anchorBlockPath ) ||
		! Array.isArray( focusBlockPath ) ||
		anchorBlockPath.length === 0 ||
		anchorBlockPath.length !== focusBlockPath.length ||
		typeof blockEditorSelect?.getBlockOrder !== 'function'
	) {
		return [];
	}

	const anchorParentPath = anchorBlockPath.slice( 0, -1 );
	const focusParentPath = focusBlockPath.slice( 0, -1 );

	if ( anchorParentPath.join( '.' ) !== focusParentPath.join( '.' ) ) {
		return [];
	}

	const parentClientId =
		anchorParentPath.length === 0
			? undefined
			: getBlockClientIdAtPath( blockEditorSelect, anchorParentPath );
	const blockOrder = blockEditorSelect.getBlockOrder( parentClientId );

	if ( ! Array.isArray( blockOrder ) ) {
		return [];
	}

	const anchorIndex = anchorBlockPath[ anchorBlockPath.length - 1 ];
	const focusIndex = focusBlockPath[ focusBlockPath.length - 1 ];
	const start = Math.min( anchorIndex, focusIndex );
	const end = Math.max( anchorIndex, focusIndex );

	return blockOrder.slice( start, end + 1 );
}

function escapeCssIdentifier( value ) {
	if ( globalThis.CSS?.escape ) {
		return globalThis.CSS.escape( value );
	}

	return String( value ).replace( /["\\]/g, '\\$&' );
}

function getBlockElement( container, clientId ) {
	if ( ! container || ! clientId ) {
		return null;
	}

	return container.querySelector(
		`[data-block="${ escapeCssIdentifier( clientId ) }"]`
	);
}

function getEditableElement( blockElement, attributeKey ) {
	if ( ! blockElement ) {
		return null;
	}

	if ( attributeKey ) {
		const attributeElement = blockElement.matches?.(
			`[data-wp-block-attribute-key="${ escapeCssIdentifier(
				attributeKey
			) }"]`
		)
			? blockElement
			: blockElement.querySelector(
					`[data-wp-block-attribute-key="${ escapeCssIdentifier(
						attributeKey
					) }"]`
			  );

		if ( attributeElement ) {
			return attributeElement;
		}
	}

	return blockElement.isContentEditable
		? blockElement
		: blockElement.querySelector( '[contenteditable="true"]' ) ||
				blockElement;
}

function getTextPosition( element, offset ) {
	if ( ! element || offset === null || offset === undefined ) {
		return null;
	}

	const ownerDocument = element.ownerDocument;
	const walker = ownerDocument.createTreeWalker(
		element,
		ownerDocument.defaultView.NodeFilter.SHOW_TEXT
	);
	let remaining = Math.max( 0, Number( offset ) || 0 );

	while ( walker.nextNode() ) {
		const node = walker.currentNode;
		const length = node.nodeValue.length;

		if ( remaining <= length ) {
			return {
				node,
				offset: remaining,
			};
		}

		remaining -= length;
	}

	return null;
}

function getRelativeRect( rect, containerRect ) {
	return {
		left: rect.left - containerRect.left,
		top: rect.top - containerRect.top,
		width: Math.max( 2, rect.width ),
		height: Math.max( 2, rect.height ),
	};
}

function getBlockRect( blockElement, containerRect ) {
	if ( ! blockElement ) {
		return null;
	}

	const rect = blockElement.getBoundingClientRect();

	if ( rect.width <= 0 || rect.height <= 0 ) {
		return null;
	}

	return getRelativeRect( rect, containerRect );
}

function isPointInRect( point, rect, margin = 0 ) {
	return (
		point.clientX >= rect.left - margin &&
		point.clientX <= rect.right + margin &&
		point.clientY >= rect.top - margin &&
		point.clientY <= rect.bottom + margin
	);
}

function areStringArraysEqual( first, second ) {
	if ( first.length !== second.length ) {
		return false;
	}

	return first.every( ( value, index ) => value === second[ index ] );
}

function getHiddenLabelKeysForPointer( container, point ) {
	if ( ! container || ! point ) {
		return [];
	}

	const labels = Array.from(
		container.querySelectorAll(
			'[data-distributed-editing-selection-overlay-label-key]'
		)
	);
	const hiddenKeys = new Set();
	const margin = 4;

	labels.forEach( ( label ) => {
		const key = label.dataset.distributedEditingSelectionOverlayLabelKey;
		const groupKey =
			label.dataset.distributedEditingSelectionOverlayGroupKey;

		if ( ! key ) {
			return;
		}

		if ( isPointInRect( point, label.getBoundingClientRect(), margin ) ) {
			hiddenKeys.add( key );
			return;
		}

		if ( ! groupKey ) {
			return;
		}

		const marks = Array.from(
			container.querySelectorAll(
				`.editor-distributed-editing-selection-overlay__mark[data-distributed-editing-selection-overlay-group-key="${ escapeCssIdentifier(
					groupKey
				) }"]`
			)
		);

		if (
			marks.some( ( mark ) =>
				isPointInRect( point, mark.getBoundingClientRect(), margin )
			)
		) {
			hiddenKeys.add( key );
		}
	} );

	return Array.from( hiddenKeys ).sort();
}

function getRangeRects(
	ownerDocument,
	containerRect,
	anchorElement,
	focusElement,
	selectionState
) {
	const anchorPosition = getTextPosition(
		anchorElement,
		selectionState.anchor?.offset
	);
	const focusPosition = getTextPosition(
		focusElement,
		selectionState.focus?.offset
	);

	if ( ! anchorPosition || ! focusPosition ) {
		return [];
	}

	try {
		const range = ownerDocument.createRange();
		range.setStart( anchorPosition.node, anchorPosition.offset );
		range.setEnd( focusPosition.node, focusPosition.offset );

		if ( selectionState.isCollapsed ) {
			range.collapse( true );
		}

		return Array.from( range.getClientRects() )
			.filter( ( rect ) => rect.width > 0 || rect.height > 0 )
			.slice( 0, 12 )
			.map( ( rect ) => getRelativeRect( rect, containerRect ) );
	} catch {
		return [];
	}
}

function measureSelectionOverlays( { container, resolvedEntries } ) {
	if ( ! container ) {
		return [];
	}

	const ownerDocument = container.ownerDocument;
	const containerRect = container.getBoundingClientRect();

	return resolvedEntries.flatMap( ( resolvedEntry, entryIndex ) => {
		const { entry, mapping, spanClientIds } = resolvedEntry;
		const { anchorClientId, focusClientId } = mapping;
		const selectionState = entry.selectionState;
		const anchorBlock = getBlockElement( container, anchorClientId );
		const focusBlock = getBlockElement( container, focusClientId );
		let rects = [];
		const shouldMeasureExactRange =
			mapping.resolvedMappingStatus ===
				DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.EXACT &&
			selectionState.anchor?.attributeKey &&
			selectionState.focus?.attributeKey &&
			selectionState.anchor?.offset !== null &&
			selectionState.focus?.offset !== null;

		if ( shouldMeasureExactRange ) {
			rects = getRangeRects(
				ownerDocument,
				containerRect,
				getEditableElement(
					anchorBlock,
					selectionState.anchor.attributeKey
				),
				getEditableElement(
					focusBlock,
					selectionState.focus.attributeKey
				),
				selectionState
			);
		}

		if ( shouldMeasureExactRange && rects.length === 0 ) {
			return [];
		}

		if (
			selectionState.kind === 'multi_block' &&
			spanClientIds?.length === 0
		) {
			return [];
		}

		if ( rects.length === 0 ) {
			const blockRects =
				spanClientIds?.length > 0
					? spanClientIds
							.map( ( clientId ) =>
								getBlockRect(
									getBlockElement( container, clientId ),
									containerRect
								)
							)
							.filter( Boolean )
					: [ getBlockRect( anchorBlock, containerRect ) ].filter(
							Boolean
					  );

			rects = blockRects;
		}

		if (
			selectionState.kind === 'multi_block' &&
			focusClientId !== anchorClientId &&
			! spanClientIds?.length
		) {
			const focusRect = getBlockRect( focusBlock, containerRect );

			if ( focusRect ) {
				rects.push( focusRect );
			}
		}

		const color = SELECTION_COLORS[ entryIndex % SELECTION_COLORS.length ];
		const displayName = entry.displayName || __( 'Another editor' );
		const label = sprintf(
			/* translators: %s: remote editor display name. */
			__( '%s is editing here' ),
			displayName
		);
		let overlayKind = selectionState.kind;

		if (
			mapping.resolvedMappingStatus ===
			DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.BLOCK_ONLY
		) {
			overlayKind = 'block_only';
		} else if ( selectionState.isCollapsed ) {
			overlayKind = 'caret';
		}

		return rects.map( ( rect, rectIndex ) => ( {
			groupKey: entry.key,
			key: `${ entry.key }-${ rectIndex }`,
			color,
			label,
			rect,
			kind: overlayKind,
			showLabel: rectIndex === 0,
		} ) );
	} );
}

function DistributedEditingSelectionOverlayLayer( {
	containerRef,
	entries,
	localBaseVersion,
	localBaseStateHash,
	localHasPendingChanges,
} ) {
	const entriesKey = entries.map( getEntryKey ).join( '|' );
	const resolvedEntries = useSelect(
		( select ) => {
			const blockEditorSelect = select( blockEditorStore );

			return entries
				.map( ( entry ) => {
					const mapping =
						getDistributedEditingSelectionPresenceMapping(
							entry.selectionState,
							{
								localBaseVersion,
								localBaseStateHash,
								localHasPendingChanges,
								resolveBlockPath: ( blockPath ) =>
									getBlockClientIdAtPath(
										blockEditorSelect,
										blockPath
									),
							}
						);
					const spanClientIds =
						mapping.resolvedMappingStatus ===
							DISTRIBUTED_EDITING_SELECTION_RESOLVED_MAPPING_STATUSES.BLOCK_ONLY &&
						entry.selectionState.kind === 'multi_block'
							? getBlockClientIdsInPathSpan(
									blockEditorSelect,
									entry.selectionState.anchor?.blockPath,
									entry.selectionState.focus?.blockPath
							  )
							: [];

					return {
						entry,
						mapping,
						spanClientIds,
					};
				} )
				.filter(
					( entry ) =>
						entry.mapping.renderable &&
						entry.mapping.resolvedDegradationReason ===
							DISTRIBUTED_EDITING_SELECTION_DEGRADATION_REASONS.NONE
				);
		},
		[
			entries,
			localBaseVersion,
			localBaseStateHash,
			localHasPendingChanges,
		]
	);
	const [ overlays, setOverlays ] = useState( [] );
	const [ hiddenLabelKeys, setHiddenLabelKeys ] = useState( [] );
	const hiddenLabelKeysRef = useRef( [] );
	const setNextHiddenLabelKeys = useCallback( ( nextKeys ) => {
		hiddenLabelKeysRef.current = nextKeys;
		setHiddenLabelKeys( ( currentKeys ) => {
			if ( areStringArraysEqual( currentKeys, nextKeys ) ) {
				return currentKeys;
			}

			return nextKeys;
		} );
	}, [] );
	const updateHiddenLabelsForPointer = useCallback(
		( event ) => {
			const container = containerRef?.current;

			if ( ! container ) {
				setNextHiddenLabelKeys( [] );
				return;
			}

			setNextHiddenLabelKeys(
				getHiddenLabelKeysForPointer( container, {
					clientX: event.clientX,
					clientY: event.clientY,
				} )
			);
		},
		[ containerRef, setNextHiddenLabelKeys ]
	);

	useEffect( () => {
		const container = containerRef?.current;

		if ( ! container || resolvedEntries.length === 0 ) {
			setOverlays( [] );
			return undefined;
		}

		const update = () => {
			setOverlays(
				measureSelectionOverlays( {
					container,
					resolvedEntries,
				} )
			);
		};
		const ownerWindow = container.ownerDocument.defaultView;

		update();
		ownerWindow.addEventListener( 'resize', update );
		container.addEventListener( 'scroll', update, true );

		const timeoutId = ownerWindow.setTimeout( update, 50 );

		return () => {
			ownerWindow.clearTimeout( timeoutId );
			ownerWindow.removeEventListener( 'resize', update );
			container.removeEventListener( 'scroll', update, true );
		};
	}, [ containerRef, entries, entriesKey, resolvedEntries ] );

	useEffect( () => {
		const container = containerRef?.current;

		if ( ! container || overlays.length === 0 ) {
			setNextHiddenLabelKeys( [] );
			return undefined;
		}

		const ownerWindow = container.ownerDocument.defaultView;
		const clearHiddenLabels = () => setNextHiddenLabelKeys( [] );

		ownerWindow.addEventListener(
			'pointermove',
			updateHiddenLabelsForPointer
		);
		ownerWindow.addEventListener( 'pointerleave', clearHiddenLabels );
		ownerWindow.addEventListener( 'blur', clearHiddenLabels );

		return () => {
			ownerWindow.removeEventListener(
				'pointermove',
				updateHiddenLabelsForPointer
			);
			ownerWindow.removeEventListener(
				'pointerleave',
				clearHiddenLabels
			);
			ownerWindow.removeEventListener( 'blur', clearHiddenLabels );
		};
	}, [
		containerRef,
		overlays.length,
		setNextHiddenLabelKeys,
		updateHiddenLabelsForPointer,
	] );

	useEffect( () => {
		const overlayKeys = new Set(
			overlays.map( ( overlay ) => overlay.key )
		);
		const nextKeys = hiddenLabelKeysRef.current.filter( ( key ) =>
			overlayKeys.has( key )
		);

		if ( ! areStringArraysEqual( nextKeys, hiddenLabelKeysRef.current ) ) {
			setNextHiddenLabelKeys( nextKeys );
		}
	}, [ overlays, setNextHiddenLabelKeys ] );

	if ( overlays.length === 0 ) {
		return null;
	}

	return (
		<div
			aria-hidden="true"
			className="editor-distributed-editing-selection-overlay"
			data-distributed-editing-selection-overlay="true"
			data-distributed-editing-selection-overlay-content-free="true"
			data-distributed-editing-selection-overlay-exposes-client-id="false"
			data-distributed-editing-selection-overlay-exposes-raw-content="false"
			data-distributed-editing-selection-overlay-exposes-raw-selected-text="false"
			data-distributed-editing-selection-overlay-interactive="false"
			style={ {
				inset: 0,
				pointerEvents: 'none',
				position: 'absolute',
				zIndex: 25,
			} }
		>
			{ overlays.map( ( overlay ) => (
				<div
					className={ `editor-distributed-editing-selection-overlay__mark editor-distributed-editing-selection-overlay__mark--${ overlay.kind }` }
					data-distributed-editing-selection-overlay-group-key={
						overlay.groupKey
					}
					key={ overlay.key }
					style={ {
						'--de-rtc-selection-color': overlay.color,
						background:
							overlay.kind === 'caret'
								? overlay.color
								: `${ overlay.color }2e`,
						border:
							overlay.kind === 'caret'
								? 0
								: `1px ${
										overlay.kind === 'block_only'
											? 'dashed'
											: 'solid'
								  } ${ overlay.color }`,
						borderRadius: '2px',
						boxSizing: 'border-box',
						height: `${ overlay.rect.height }px`,
						left: `${ overlay.rect.left }px`,
						minHeight: '2px',
						pointerEvents: 'none',
						position: 'absolute',
						top: `${ overlay.rect.top }px`,
						width:
							overlay.kind === 'caret'
								? '2px'
								: `${ overlay.rect.width }px`,
					} }
				>
					{ overlay.showLabel && (
						<span
							className={ [
								'editor-distributed-editing-selection-overlay__label',
								hiddenLabelKeys.includes( overlay.key ) &&
									'editor-distributed-editing-selection-overlay__label--hidden',
							]
								.filter( Boolean )
								.join( ' ' ) }
							data-distributed-editing-selection-overlay-group-key={
								overlay.groupKey
							}
							data-distributed-editing-selection-overlay-label-key={
								overlay.key
							}
							data-distributed-editing-selection-overlay-label-hover-fades="true"
							onPointerEnter={ updateHiddenLabelsForPointer }
							style={ {
								background: overlay.color,
								borderRadius: '2px',
								color: '#fff',
								display: 'block',
								fontSize: '11px',
								fontWeight: 500,
								insetBlockStart: '-22px',
								insetInlineStart: 0,
								lineHeight: 1.2,
								maxWidth: 'min(180px, 40vw)',
								opacity: hiddenLabelKeys.includes( overlay.key )
									? 0
									: 1,
								overflow: 'hidden',
								padding: '3px 6px',
								pointerEvents: hiddenLabelKeys.includes(
									overlay.key
								)
									? 'none'
									: 'auto',
								position: 'absolute',
								textOverflow: 'ellipsis',
								transition: 'opacity 120ms ease-out',
								whiteSpace: 'nowrap',
								willChange: 'opacity',
							} }
						>
							{ overlay.label }
						</span>
					) }
				</div>
			) ) }
		</div>
	);
}

export default function DistributedEditingSelectionOverlay() {
	const {
		distributedEditingEnabled,
		sessionState,
		localBaseVersion,
		localBaseStateHash,
		localHasPendingChanges,
	} = useSelect( ( select ) => {
		const editorSelect = select( editorStore );
		const currentSessionState =
			editorSelect.getDistributedEditingSessionState?.() || {};
		const editedPostContent = editorSelect.getEditedPostContent?.();
		const comparableEditedContent =
			typeof editedPostContent === 'string'
				? getDistributedEditingComparablePostContent(
						editedPostContent
				  )
				: null;
		const comparableBaseContent =
			typeof currentSessionState.clientBaseContent === 'string'
				? getDistributedEditingComparablePostContent(
						currentSessionState.clientBaseContent
				  )
				: null;

		return {
			distributedEditingEnabled: Boolean(
				editorSelect.getEditorSettings?.()?.distributedEditing?.enabled
			),
			sessionState: currentSessionState,
			localBaseVersion: currentSessionState.clientBaseVersion,
			localBaseStateHash:
				currentSessionState.distributedEditingPostStateHash,
			localHasPendingChanges:
				typeof comparableEditedContent === 'string' &&
				typeof comparableBaseContent === 'string' &&
				comparableEditedContent !== comparableBaseContent,
		};
	}, [] );
	const entries = useMemo(
		() =>
			distributedEditingEnabled
				? getSelectionEntries( sessionState )
				: [],
		[ distributedEditingEnabled, sessionState ]
	);

	if ( entries.length === 0 ) {
		return null;
	}

	return (
		<BlockCanvasCover.Fill>
			{ ( { containerRef } ) => (
				<DistributedEditingSelectionOverlayLayer
					containerRef={ containerRef }
					entries={ entries }
					localBaseVersion={ localBaseVersion }
					localBaseStateHash={ localBaseStateHash }
					localHasPendingChanges={ localHasPendingChanges }
				/>
			) }
		</BlockCanvasCover.Fill>
	);
}
