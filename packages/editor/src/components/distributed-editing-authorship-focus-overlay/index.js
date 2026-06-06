/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import {
	getDistributedEditingAuthorshipBlockEntry,
	getDistributedEditingAuthorshipRichTextRanges,
} from '../distributed-editing-risky-block-review';

const { BlockCanvasCover } = unlock( blockEditorPrivateApis );

function escapeCssIdentifier( value ) {
	if ( globalThis.CSS?.escape ) {
		return globalThis.CSS.escape( value );
	}

	return String( value ).replace( /["\\]/g, '\\$&' );
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

function getBlockElement( container, clientId ) {
	if ( ! container || ! clientId ) {
		return null;
	}

	return container.querySelector(
		`[data-block="${ escapeCssIdentifier( clientId ) }"]`
	);
}

function getEditableElement( blockElement, field ) {
	if ( ! blockElement ) {
		return null;
	}

	const attributeKey = field === 'innerHTML' ? 'content' : field;
	const attributeElement = blockElement.querySelector(
		`[data-wp-block-attribute-key="${ escapeCssIdentifier(
			attributeKey
		) }"]`
	);

	return (
		attributeElement ||
		( blockElement.isContentEditable ? blockElement : null ) ||
		blockElement.querySelector( '[contenteditable="true"]' ) ||
		null
	);
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
	let lastTextNode = null;

	while ( walker.nextNode() ) {
		const node = walker.currentNode;
		const length = node.nodeValue.length;
		lastTextNode = node;

		if ( remaining <= length ) {
			return {
				node,
				offset: remaining,
			};
		}

		remaining -= length;
	}

	if ( lastTextNode ) {
		return {
			node: lastTextNode,
			offset: lastTextNode.nodeValue.length,
		};
	}

	return null;
}

function getTextLength( element ) {
	if ( ! element ) {
		return 0;
	}

	const ownerDocument = element.ownerDocument;
	const walker = ownerDocument.createTreeWalker(
		element,
		ownerDocument.defaultView.NodeFilter.SHOW_TEXT
	);
	let length = 0;

	while ( walker.nextNode() ) {
		length += walker.currentNode.nodeValue.length;
	}

	return length;
}

function normalizeRangeList( ranges ) {
	return ranges
		.map( ( range ) => ( {
			start: Math.max( 0, Number( range.start ) || 0 ),
			end: Math.max( 0, Number( range.end ) || 0 ),
		} ) )
		.filter( ( range ) => range.end > range.start )
		.sort( ( left, right ) =>
			left.start === right.start
				? left.end - right.end
				: left.start - right.start
		);
}

function getComplementRanges( focusRanges, textLength ) {
	const ranges = [];
	let cursor = 0;

	for ( const range of normalizeRangeList( focusRanges ) ) {
		const start = Math.min( textLength, range.start );
		const end = Math.min( textLength, range.end );

		if ( start > cursor ) {
			ranges.push( {
				start: cursor,
				end: start,
			} );
		}

		cursor = Math.max( cursor, end );
	}

	if ( cursor < textLength ) {
		ranges.push( {
			start: cursor,
			end: textLength,
		} );
	}

	return ranges;
}

function getAuthorshipDimRanges( {
	blockAuthorship,
	activeAttributionKey,
	textLength,
} ) {
	const richTextRanges =
		getDistributedEditingAuthorshipRichTextRanges( blockAuthorship );
	const otherRanges = richTextRanges.filter(
		( range ) => range.attributionKey !== activeAttributionKey
	);
	const blockAttributionKey =
		blockAuthorship.attributionKey || blockAuthorship.attribution_key || '';

	if ( blockAttributionKey === activeAttributionKey ) {
		return otherRanges;
	}

	const focusedRanges = richTextRanges.filter(
		( range ) => range.attributionKey === activeAttributionKey
	);

	if ( focusedRanges.length ) {
		return getComplementRanges( focusedRanges, textLength );
	}

	return [];
}

function measureAuthorshipFocusOverlays( {
	activeAttributionKey,
	authorship,
	blockEditorSelect,
	container,
} ) {
	if ( ! activeAttributionKey || ! Array.isArray( authorship?.blocks ) ) {
		return [];
	}

	const containerRect = container.getBoundingClientRect();
	const overlays = [];

	for ( const blockAuthorship of authorship.blocks ) {
		const blockPath =
			blockAuthorship.path ||
			blockAuthorship.blockPath ||
			blockAuthorship.block_path;
		const normalizedBlockAuthorship =
			getDistributedEditingAuthorshipBlockEntry( authorship, blockPath );

		if ( ! normalizedBlockAuthorship ) {
			continue;
		}

		const richTextRanges = getDistributedEditingAuthorshipRichTextRanges(
			normalizedBlockAuthorship
		);

		if ( richTextRanges.length === 0 ) {
			continue;
		}

		const clientId = getBlockClientIdAtPath( blockEditorSelect, blockPath );
		const blockElement = getBlockElement( container, clientId );
		const richText =
			normalizedBlockAuthorship.richText ||
			normalizedBlockAuthorship.rich_text ||
			{};
		const editableElement = getEditableElement(
			blockElement,
			richText.field || richText.attributeKey || 'innerHTML'
		);
		const textLength = getTextLength( editableElement );
		const dimRanges = getAuthorshipDimRanges( {
			activeAttributionKey,
			blockAuthorship: normalizedBlockAuthorship,
			textLength,
		} );

		for ( const range of dimRanges ) {
			const start = getTextPosition( editableElement, range.start );
			const end = getTextPosition( editableElement, range.end );

			if ( ! start || ! end ) {
				continue;
			}

			const domRange = editableElement.ownerDocument.createRange();
			domRange.setStart( start.node, start.offset );
			domRange.setEnd( end.node, end.offset );

			for ( const rect of Array.from( domRange.getClientRects() ) ) {
				if ( rect.width <= 0 || rect.height <= 0 ) {
					continue;
				}

				overlays.push( {
					key: `${ clientId }-${ range.start }-${ range.end }-${ overlays.length }`,
					rect: {
						height: Math.max( 2, rect.height ),
						left: rect.left - containerRect.left,
						top: rect.top - containerRect.top,
						width: Math.max( 2, rect.width ),
					},
				} );
			}
		}
	}

	return overlays;
}

function DistributedEditingAuthorshipFocusOverlayLayer( {
	activeAttributionKey,
	authorship,
	containerRef,
} ) {
	const entriesKey = useMemo(
		() =>
			Array.isArray( authorship?.blocks )
				? authorship.blocks
						.map( ( block ) =>
							[
								block?.path?.join?.( '.' ) || '',
								block?.serializedBlockHash ||
									block?.serialized_block_hash ||
									'',
								getDistributedEditingAuthorshipRichTextRanges(
									block
								)
									.map(
										( range ) =>
											`${ range.start }-${ range.end }-${ range.attributionKey }`
									)
									.join( ',' ),
							].join( ':' )
						)
						.join( '|' )
				: '',
		[ authorship ]
	);
	const blockEditorSelect = useSelect(
		( select ) => select( blockEditorStore ),
		[]
	);
	const [ overlays, setOverlays ] = useState( [] );

	useEffect( () => {
		const container = containerRef?.current;

		if ( ! container || ! activeAttributionKey || ! entriesKey ) {
			setOverlays( [] );
			return undefined;
		}

		const update = () => {
			setOverlays(
				measureAuthorshipFocusOverlays( {
					activeAttributionKey,
					authorship,
					blockEditorSelect,
					container,
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
	}, [
		activeAttributionKey,
		authorship,
		blockEditorSelect,
		containerRef,
		entriesKey,
	] );

	if ( overlays.length === 0 ) {
		return null;
	}

	return (
		<div
			aria-hidden="true"
			className="editor-distributed-editing-authorship-focus-overlay"
			data-distributed-editing-authorship-focus-overlay="true"
			data-distributed-editing-authorship-focus-overlay-content-free="true"
			style={ {
				inset: 0,
				pointerEvents: 'none',
				position: 'absolute',
				zIndex: 24,
			} }
		>
			{ overlays.map( ( overlay ) => (
				<div
					className="editor-distributed-editing-authorship-focus-overlay__dim-range"
					key={ overlay.key }
					style={ {
						background: 'rgba(255, 255, 255, 0.72)',
						borderRadius: '2px',
						height: `${ overlay.rect.height }px`,
						left: `${ overlay.rect.left }px`,
						pointerEvents: 'none',
						position: 'absolute',
						top: `${ overlay.rect.top }px`,
						width: `${ overlay.rect.width }px`,
					} }
				/>
			) ) }
		</div>
	);
}

export default function DistributedEditingAuthorshipFocusOverlay() {
	const { activeAttributionKey, authorship, distributedEditingEnabled } =
		useSelect( ( select ) => {
			const editorSelect = select( editorStore );
			const sessionState =
				editorSelect.getDistributedEditingSessionState?.() || {};

			return {
				activeAttributionKey:
					sessionState.authorshipFocusAttributionKey || null,
				authorship: sessionState.clientBaseSyncMeta?.authorship || null,
				distributedEditingEnabled: Boolean(
					editorSelect.getEditorSettings?.()?.distributedEditing
						?.enabled
				),
			};
		}, [] );

	if (
		! distributedEditingEnabled ||
		! activeAttributionKey ||
		! Array.isArray( authorship?.blocks )
	) {
		return null;
	}

	return (
		<BlockCanvasCover.Fill>
			{ ( { containerRef } ) => (
				<DistributedEditingAuthorshipFocusOverlayLayer
					activeAttributionKey={ activeAttributionKey }
					authorship={ authorship }
					containerRef={ containerRef }
				/>
			) }
		</BlockCanvasCover.Fill>
	);
}
