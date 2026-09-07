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

	function editorState() {
		try {
			const select = window.wp.data.select( 'core/block-editor' );
			return (
				'blocks=' +
				select.getBlockOrder().length +
				' selected=' +
				( select.getSelectedBlockClientId() ? 'yes' : 'no' )
			);
		} catch {
			return 'no-store';
		}
	}

	function activeElement( doc ) {
		const element = doc.activeElement;
		return element
			? element.tagName +
					'.' +
					( element.className || '' ).split( ' ' )[ 0 ]
			: 'none';
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
		const proto = doc.defaultView.KeyboardEvent.prototype;
		const preventDefault = proto.preventDefault;
		proto.preventDefault = function () {
			if ( this.type === 'keydown' && this.key === 'Enter' ) {
				const stack = new Error().stack
					.split( '\n' )
					.slice( 1, 5 )
					.map( ( line ) =>
						line.replace( /^.*\/build\/scripts\//, '' ).trim()
					)
					.join( ' < ' );
				record( doc, 'preventDefault ' + stack );
			}
			return preventDefault.call( this );
		};
		doc.addEventListener(
			'keydown',
			( event ) =>
				event.key === 'Enter' &&
				record(
					doc,
					'keydown target=' +
						event.target.tagName +
						' active=' +
						activeElement( doc ) +
						' ' +
						editorState()
				),
			true
		);
		// Bubble phase: after the handlers that may cancel the key.
		doc.addEventListener(
			'keydown',
			( event ) =>
				event.key === 'Enter' &&
				record( doc, 'keydown-cancelled:' + event.defaultPrevented )
		);
		doc.addEventListener(
			'beforeinput',
			( event ) => {
				record( doc, 'beforeinput:' + event.inputType );
				if (
					event.inputType === 'insertParagraph' ||
					event.inputType === 'insertLineBreak'
				) {
					queueMicrotask( () => record( doc, 'microtask' ) );
					setTimeout( () => record( doc, 'timeout' ), 0 );
				}
			},
			true
		);
		doc.addEventListener(
			'input',
			( event ) => record( doc, 'input:' + event.inputType ),
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
