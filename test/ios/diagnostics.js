/**
 * Diagnostic only: records the order of the events around Enter and where
 * the caret is at each of them, into a status element that the UI test can
 * read through accessibility. Loaded by the mu-plugin in blueprint.json.
 */
( function () {
	const start = performance.now();
	const log = [];
	const status = document.createElement( 'div' );
	status.setAttribute( 'role', 'status' );
	status.style.cssText =
		'position:fixed;left:0;bottom:0;z-index:2147483647;background:#fff;font:8px monospace;max-height:24px;overflow:hidden';
	status.textContent = 'DIAG';
	document.body.appendChild( status );

	function describe( doc ) {
		const selection = doc.getSelection();
		const node = selection && selection.anchorNode;
		if ( ! node ) {
			return 'none';
		}
		const name =
			node.nodeType === 3
				? '#text' +
				  JSON.stringify(
						node.nodeValue.replace( /\uFEFF/g, 'F' ).slice( 0, 6 )
				  )
				: node.nodeName;
		return name + '@' + selection.anchorOffset;
	}

	function record( doc, name ) {
		log.push(
			Math.round( performance.now() - start ) +
				' ' +
				name +
				' ' +
				describe( doc )
		);
		status.textContent = 'DIAG ' + log.slice( -12 ).join( ' | ' );
	}

	function observe( doc ) {
		if ( doc.__iosDiag ) {
			return;
		}
		doc.__iosDiag = true;
		doc.addEventListener(
			'keydown',
			( event ) => event.key === 'Enter' && record( doc, 'keydown' ),
			true
		);
		doc.addEventListener(
			'beforeinput',
			( event ) => {
				if ( event.inputType !== 'insertParagraph' ) {
					return;
				}
				record( doc, 'beforeinput' );
				queueMicrotask( () => record( doc, 'microtask' ) );
				setTimeout( () => record( doc, 'timeout' ), 0 );
			},
			true
		);
		doc.addEventListener( 'focusin', () => record( doc, 'focusin' ), true );
		doc.addEventListener(
			'selectionchange',
			() => record( doc, 'selectionchange' ),
			true
		);
	}

	observe( document );
	setInterval( () => {
		const frame = document.querySelector( 'iframe[name="editor-canvas"]' );
		if ( frame && frame.contentDocument ) {
			observe( frame.contentDocument );
		}
	}, 200 );
} )();
