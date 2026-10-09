import { useRefEffect } from '@wordpress/compose';
import { useLayoutEffect, useRef } from '@wordpress/element';

function copyBlocksWithEvent( { html, plainText }, ownerDocument ) {
	const selection = ownerDocument.getSelection();
	const ranges = selection
		? Array.from( { length: selection.rangeCount }, ( _, index ) =>
				selection.getRangeAt( index ).cloneRange()
			)
		: [];
	const activeElement = ownerDocument.activeElement;
	const inputSelection =
		activeElement && typeof activeElement.selectionStart === 'number'
			? {
					start: activeElement.selectionStart,
					end: activeElement.selectionEnd,
					direction: activeElement.selectionDirection,
				}
			: undefined;
	const textarea = ownerDocument.createElement( 'textarea' );
	textarea.value = html === undefined ? plainText : plainText || ' ';
	textarea.setAttribute( 'readonly', '' );
	textarea.style.position = 'fixed';
	textarea.style.left = '-9999px';
	textarea.style.top = '-9999px';
	let copied = false;
	const onCopy = ( event ) => {
		if (
			html === undefined ||
			event.target !== textarea ||
			! event.clipboardData
		) {
			return;
		}
		event.clipboardData.setData( 'text/html', html );
		event.clipboardData.setData( 'text/plain', plainText );
		event.preventDefault();
		copied = true;
	};
	try {
		ownerDocument.body.appendChild( textarea );
		ownerDocument.addEventListener( 'copy', onCopy, true );
		textarea.focus( { preventScroll: true } );
		textarea.select();
		return (
			ownerDocument.execCommand( 'copy' ) &&
			( html === undefined || copied )
		);
	} catch {
		return false;
	} finally {
		ownerDocument.removeEventListener( 'copy', onCopy, true );
		textarea.remove();
		activeElement?.focus( { preventScroll: true } );
		if ( inputSelection ) {
			activeElement.setSelectionRange(
				inputSelection.start,
				inputSelection.end,
				inputSelection.direction
			);
		} else if ( selection ) {
			selection.removeAllRanges();
			ranges.forEach( ( range ) => selection.addRange( range ) );
		}
	}
}

export async function writeBlocksToClipboard( content, trigger ) {
	const ownerDocument = trigger?.ownerDocument;
	if ( ! ownerDocument ) {
		return false;
	}
	const view = ownerDocument.defaultView;
	if ( view?.navigator.clipboard?.write && view.ClipboardItem ) {
		try {
			await view.navigator.clipboard.write( [
				new view.ClipboardItem( {
					'text/html': new view.Blob( [ content.html ], {
						type: 'text/html',
					} ),
					'text/plain': new view.Blob( [ content.plainText ], {
						type: 'text/plain',
					} ),
				} ),
			] );
			return true;
		} catch {
			return copyBlocksWithEvent( content, ownerDocument );
		}
	}
	return copyBlocksWithEvent( content, ownerDocument );
}

async function writeTextToClipboard( text, trigger ) {
	const ownerDocument = trigger.ownerDocument;
	const view = ownerDocument.defaultView;
	try {
		if ( view?.navigator.clipboard?.writeText ) {
			await view.navigator.clipboard.writeText( text );
			return true;
		}
		return copyBlocksWithEvent( { plainText: text }, ownerDocument );
	} catch {
		return false;
	}
}

export default function useBlockCopyToClipboard(
	getContent,
	getText,
	onSuccess
) {
	const latestRef = useRef( { getContent, getText, onSuccess } );
	useLayoutEffect( () => {
		latestRef.current = { getContent, getText, onSuccess };
	}, [ getContent, getText, onSuccess ] );
	return useRefEffect( ( node ) => {
		let isActive = true;
		const onClick = async () => {
			const content = latestRef.current.getContent();
			const success = content.hasBoundAttributes
				? await writeBlocksToClipboard( content, node )
				: await writeTextToClipboard(
						latestRef.current.getText(),
						node
					);
			if ( success ) {
				if ( isActive ) {
					node.focus();
				}
				latestRef.current.onSuccess?.();
			}
		};
		node.addEventListener( 'click', onClick );
		return () => {
			isActive = false;
			node.removeEventListener( 'click', onClick );
		};
	}, [] );
}
