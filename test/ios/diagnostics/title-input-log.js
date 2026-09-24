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

	function describeNode( node ) {
		if ( ! node ) {
			return '-';
		}
		if ( node.nodeType === 3 ) {
			return JSON.stringify( node.data.slice( 0, 4 ) );
		}
		const placeholder =
			node.hasAttribute &&
			node.hasAttribute( 'data-rich-text-placeholder' );
		return node.nodeName + ( placeholder ? '[placeholder]' : '' );
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
		render();
	}

	function render() {
		// Everything, so that what happens between the field attaching and
		// the first key is visible; the oldest entries go first when the
		// log grows past what accessibility reads back.
		const shown =
			entries.length > 90
				? entries.slice( 0, 30 ).concat( entries.slice( -60 ) )
				: entries;
		log.textContent = 'TLOG ' + shown.join( ' | ' );
	}

	// Where the time went before the editor was usable: the document's own
	// timing and every resource it loaded, grouped by kind, plus the slowest
	// ones by name. Times are milliseconds from the navigation start.
	function recordTiming( win, label ) {
		const [ nav ] = win.performance.getEntriesByType( 'navigation' );
		const resources = win.performance.getEntriesByType( 'resource' );
		const kinds = {};
		for ( const entry of resources ) {
			const kind = entry.initiatorType || '?';
			kinds[ kind ] = kinds[ kind ] || { count: 0, ms: 0 };
			kinds[ kind ].count += 1;
			kinds[ kind ].ms += entry.duration;
		}
		const byKind = Object.entries( kinds )
			.map(
				( [ kind, { count, ms } ] ) =>
					kind + '=' + count + '/' + Math.round( ms ) + 'ms'
			)
			.join( ' ' );
		const slowest = resources
			.slice()
			.sort( ( a, b ) => b.duration - a.duration )
			.slice( 0, 8 )
			.map(
				( entry ) =>
					entry.name
						.replace(
							/^.*\/(wp-content|wp-includes|wp-json|wp-admin)\//,
							'$1/'
						)
						.split( '?' )[ 0 ] +
					' ' +
					Math.round( entry.startTime ) +
					'+' +
					Math.round( entry.duration )
			)
			.join( ', ' );
		entries.push(
			Date.now() -
				started +
				' TIMING ' +
				label +
				( nav
					? ' ttfb=' +
						Math.round( nav.responseStart ) +
						' domInteractive=' +
						Math.round( nav.domInteractive ) +
						' load=' +
						Math.round( nav.loadEventEnd )
					: '' ) +
				' resources ' +
				resources.length +
				': ' +
				byKind +
				' slowest: ' +
				slowest
		);
		render();
	}

	// Which script mutates the title's tree, and during which event: DOM
	// changes made by the browser itself never pass through these.
	function stackTop() {
		return new Error().stack
			.split( '\n' )
			.slice( 4, 8 )
			.map( ( line ) =>
				line
					.trim()
					.replace( /^.*\/([^/]+\/[^/]+)$/, '$1' )
					.replace( /\?[^:]*/, '' )
					.replace( /\)$/, '' )
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
					note(
						method +
							' ' +
							describeNode( args[ 0 ] ) +
							( args[ 1 ]
								? ' / ' + describeNode( args[ 1 ] )
								: '' )
					);
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
					note(
						method +
							' ' +
							describeNode( args[ 0 ] ) +
							( args[ 1 ]
								? ' / ' + describeNode( args[ 1 ] )
								: '' )
					);
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

	// The top document sees a key the canvas never gets: log its key, input
	// and focus events, with the target, prefixed to tell them apart.
	function watchTopDocument() {
		const topTitle = { textContent: '', childNodes: [] };
		for ( const type of [
			'keydown',
			'beforeinput',
			'input',
			'keyup',
			'focusin',
			'focusout',
		] ) {
			document.addEventListener(
				type,
				( event ) =>
					record(
						document,
						topTitle,
						'TOP ' +
							type +
							' ' +
							( event.inputType || event.key || '' ) +
							' target=' +
							event.target.nodeName +
							( event.target.name
								? '[' + event.target.name + ']'
								: '' )
					),
				true
			);
		}
		window.addEventListener( 'load', () =>
			record( document, topTitle, 'TOP load' )
		);
		document.addEventListener( 'readystatechange', () =>
			record(
				document,
				topTitle,
				'TOP readyState=' + document.readyState
			)
		);
		if ( window.visualViewport ) {
			window.visualViewport.addEventListener( 'resize', () =>
				record(
					document,
					topTitle,
					'TOP viewport h=' +
						Math.round( window.visualViewport.height )
				)
			);
		}
		// A timer that fires late means the main thread was busy: record
		// stretches over 150 ms with when they started.
		let expected = Date.now() + 50;
		( function tick() {
			const now = Date.now();
			const late = now - expected;
			if ( late > 150 ) {
				record(
					document,
					topTitle,
					'TOP busy ' + late + 'ms from ' + ( expected - started )
				);
			}
			expected = now + 50;
			setTimeout( tick, 50 );
		} )();
	}
	watchTopDocument();

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
		recordTiming( window, 'top' );
		recordTiming( frame.contentWindow, 'canvas' );
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
						.map( ( m ) =>
							m.type === 'childList'
								? 'in ' +
									describeNode( m.target ) +
									' +[' +
									Array.from( m.addedNodes )
										.map( describeNode )
										.join( ' ' ) +
									'] -[' +
									Array.from( m.removedNodes )
										.map( describeNode )
										.join( ' ' ) +
									']'
								: 'data ' +
									describeNode( m.target ) +
									' was ' +
									JSON.stringify(
										( m.oldValue || '' ).slice( 0, 4 )
									)
						)
						.join( ', ' )
			)
		).observe( title, {
			childList: true,
			characterData: true,
			characterDataOldValue: true,
			subtree: true,
		} );
		// The canvas can be replaced; keep looking for a new one.
		setTimeout( attach, 2000 );
	}
	attach();
} )();
