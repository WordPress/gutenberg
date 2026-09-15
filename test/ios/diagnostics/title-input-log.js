/**
 * Diagnostic only: records what the page sees around each key in the post
 * title (events, selection, DOM text) in a log element the UI test reads
 * through accessibility when the typed text does not match. Copied into the
 * site as an mu-plugin by blueprint.json.
 */
( function () {
	const log = document.createElement( 'div' );
	log.setAttribute( 'role', 'log' );
	log.style.cssText =
		'position:fixed;left:0;top:0;opacity:0;pointer-events:none;font:8px monospace;max-height:16px;overflow:hidden';
	log.textContent = 'TLOG';
	document.body.appendChild( log );
	const entries = [];
	const started = Date.now();

	function describeSelection( doc ) {
		const selection = doc.getSelection();
		if ( ! selection || ! selection.rangeCount ) {
			return 'none';
		}
		const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
		const name = ( node ) => {
			if ( ! node ) {
				return '-';
			}
			if ( node.nodeType === 3 ) {
				return '#text' + JSON.stringify( node.data.slice( 0, 6 ) );
			}
			const placeholder = node.hasAttribute(
				'data-rich-text-placeholder'
			);
			return node.nodeName + ( placeholder ? '[placeholder]' : '' );
		};
		const inPlaceholder = !! anchorNode?.parentElement?.closest(
			'[data-rich-text-placeholder]'
		);
		return (
			name( anchorNode ) +
			'@' +
			anchorOffset +
			( selection.isCollapsed
				? ''
				: '->' + name( focusNode ) + '@' + focusOffset ) +
			( inPlaceholder ? ' IN-PLACEHOLDER' : '' )
		);
	}

	function describeChildren( title ) {
		return Array.from( title.childNodes )
			.slice( 0, 6 )
			.map( ( node ) => {
				if ( node.nodeType === 3 ) {
					return JSON.stringify( node.data.slice( 0, 4 ) );
				}
				const placeholder = node.hasAttribute(
					'data-rich-text-placeholder'
				);
				return node.nodeName + ( placeholder ? '[placeholder]' : '' );
			} )
			.join( ',' );
	}

	function record( doc, title, what ) {
		const active = doc.activeElement;
		entries.push(
			Date.now() -
				started +
				' ' +
				what +
				' sel=' +
				describeSelection( doc ) +
				' title=' +
				JSON.stringify( ( title.textContent || '' ).slice( 0, 12 ) ) +
				' kids=' +
				describeChildren( title ) +
				' active=' +
				( active
					? active.nodeName + ( active === title ? '(title)' : '' )
					: '-' )
		);
		// Everything from just before the first key onward.
		const first = entries.findIndex( ( entry ) =>
			entry.includes( 'keydown<' )
		);
		const from =
			first === -1
				? Math.max( 0, entries.length - 12 )
				: Math.max( 0, first - 8 );
		log.textContent =
			'TLOG ' + entries.slice( from, from + 70 ).join( ' | ' );
	}

	// Which script mutates the title's tree, and during which event: DOM
	// changes made by the browser itself never pass through these.
	function stackTop() {
		return new Error().stack
			.split( '\n' )
			.slice( 4, 8 )
			.map( ( line ) =>
				line.trim().replace( /^.*\//, '' ).replace( /\)$/, '' )
			)
			.join( ' > ' );
	}

	function wrapDomMethods( win, doc ) {
		function inTitle( node ) {
			const title = doc.querySelector( '.editor-post-title' );
			return title && ( node === title || title.contains( node ) );
		}
		function note( what ) {
			const title = doc.querySelector( '.editor-post-title' );
			record(
				doc,
				title,
				'dom ' +
					what +
					' during=' +
					( win.event ? win.event.type : '-' ) +
					' at=' +
					stackTop()
			);
		}
		for ( const method of [
			'appendChild',
			'insertBefore',
			'replaceChild',
			'removeChild',
		] ) {
			const original = win.Node.prototype[ method ];
			win.Node.prototype[ method ] = function ( ...args ) {
				if ( inTitle( this ) ) {
					note( method );
				}
				return original.apply( this, args );
			};
		}
		for ( const method of [
			'appendData',
			'insertData',
			'deleteData',
			'replaceData',
		] ) {
			const original = win.CharacterData.prototype[ method ];
			win.CharacterData.prototype[ method ] = function ( ...args ) {
				if ( inTitle( this ) ) {
					note( method );
				}
				return original.apply( this, args );
			};
		}
		const splitText = win.Text.prototype.splitText;
		win.Text.prototype.splitText = function ( ...args ) {
			if ( inTitle( this ) ) {
				note( 'splitText' );
			}
			return splitText.apply( this, args );
		};
		for ( const [ proto, prop ] of [
			[ win.CharacterData.prototype, 'data' ],
			[ win.Node.prototype, 'nodeValue' ],
			[ win.Node.prototype, 'textContent' ],
			[ win.Element.prototype, 'innerHTML' ],
		] ) {
			const descriptor = Object.getOwnPropertyDescriptor( proto, prop );
			Object.defineProperty( proto, prop, {
				...descriptor,
				set( value ) {
					if ( inTitle( this ) ) {
						note(
							prop +
								'=' +
								JSON.stringify( String( value ).slice( 0, 8 ) )
						);
					}
					descriptor.set.call( this, value );
				},
			} );
		}
	}

	function attach() {
		const frame = document.querySelector( 'iframe[name="editor-canvas"]' );
		const doc = frame?.contentDocument;
		const title = doc?.querySelector( '.editor-post-title' );
		if ( ! title ) {
			setTimeout( attach, 200 );
			return;
		}
		if ( doc.__titleLog ) {
			return;
		}
		doc.__titleLog = true;
		record( doc, title, 'attached' );
		wrapDomMethods( frame.contentWindow, doc );
		for ( const type of [
			'keydown',
			'beforeinput',
			'input',
			'keyup',
			'focusin',
			'focusout',
			'compositionstart',
		] ) {
			// Document capture runs before the title's own listeners; the
			// bubble phase runs after them.
			doc.addEventListener(
				type,
				( event ) =>
					record(
						doc,
						title,
						type +
							'< ' +
							( event.inputType || event.key || '' ) +
							' target=' +
							event.target.nodeName
					),
				true
			);
			doc.addEventListener( type, ( event ) =>
				record(
					doc,
					title,
					type + '> prevented=' + event.defaultPrevented
				)
			);
		}
		doc.addEventListener( 'selectionchange', () =>
			record( doc, title, 'selectionchange' )
		);
		new window.MutationObserver( ( mutations ) =>
			record(
				doc,
				title,
				'mutation ' +
					mutations
						.map(
							( m ) =>
								m.type +
								( m.type === 'childList'
									? '+' +
									  m.addedNodes.length +
									  '-' +
									  m.removedNodes.length
									: '' )
						)
						.join( ',' )
			)
		).observe( title, {
			childList: true,
			characterData: true,
			subtree: true,
		} );
		// The canvas can be replaced; keep looking for a new one.
		setTimeout( attach, 2000 );
	}
	attach();
} )();
