/**
 * Temporary diagnostics: records what the editor page does while it loads
 * and around the first tap, in a log element the UI test reads through
 * accessibility. Installed as an mu-plugin by blueprint.json.
 */
( function () {
	const started = performance.now();
	const entries = [];
	const log = document.createElement( 'div' );
	log.setAttribute( 'role', 'log' );
	log.style.cssText =
		'position:fixed;left:0;top:0;opacity:0;pointer-events:none;font:8px monospace;max-height:16px;overflow:hidden';
	log.textContent = 'PLOG';
	const now = () => Math.round( performance.now() - started );
	function add( text ) {
		entries.push( now() + ' ' + text );
		const shown =
			entries.length > 160
				? entries.slice( 0, 40 ).concat( [ '...' ], entries.slice( -120 ) )
				: entries;
		log.textContent = 'PLOG ' + shown.join( ' | ' );
	}
	function describe( node ) {
		if ( ! node || ! node.nodeName ) {
			return String( node );
		}
		if ( node.nodeType === 3 ) {
			return '#text';
		}
		const label = node.getAttribute && node.getAttribute( 'aria-label' );
		const cls = ( node.className && node.className.baseVal === undefined ? node.className : '' )
			.split( ' ' )
			.filter( Boolean )
			.slice( 0, 2 )
			.join( '.' );
		return node.nodeName + ( cls ? '.' + cls : '' ) + ( label ? '[' + label.slice( 0, 20 ) + ']' : '' );
	}
	document.addEventListener( 'DOMContentLoaded', () => {
		document.body.appendChild( log );
		add( 'DOMContentLoaded' );
	} );
	window.addEventListener( 'load', () => add( 'window load' ) );

	// Busy stretches of the main thread.
	let last = performance.now();
	setInterval( () => {
		const t = performance.now();
		if ( t - last > 150 ) {
			add( 'busy ' + Math.round( t - last - 50 ) );
		}
		last = t;
	}, 50 );

	// Requests.
	let pending = 0;
	const originalFetch = window.fetch;
	window.fetch = function ( input, init ) {
		const url = String( input && input.url ? input.url : input )
			.replace( /^.*?(\/wp-json\/|rest_route=)/, '' )
			.split( /[?&]_locale/ )[ 0 ]
			.slice( 0, 60 );
		const begin = now();
		pending++;
		add( 'req+ ' + url + ' pending=' + pending );
		return originalFetch.apply( this, arguments ).finally( () => {
			pending--;
			add( 'req- ' + url + ' ' + ( now() - begin ) + 'ms pending=' + pending );
		} );
	};

	// Input, focus and scrolling in a document.
	function watch( doc, name ) {
		for ( const type of [ 'touchstart', 'touchend', 'mousedown', 'click', 'focusin' ] ) {
			doc.addEventListener(
				type,
				( event ) => add( name + ' ' + type + ' ' + describe( event.target ) + ' active=' + describe( doc.activeElement ) ),
				true
			);
		}
		let scrollTimer;
		doc.addEventListener(
			'scroll',
			() => {
				clearTimeout( scrollTimer );
				scrollTimer = setTimeout(
					() => add( name + ' scrolled y=' + Math.round( doc.defaultView.scrollY ) ),
					100
				);
			},
			true
		);
	}
	watch( document, 'top' );

	// The canvas frame.
	const seen = new WeakSet();
	new MutationObserver( () => {
		const frame = document.querySelector( 'iframe[name="editor-canvas"]' );
		if ( ! frame || seen.has( frame ) ) {
			return;
		}
		seen.add( frame );
		add( 'canvas frame added' );
		frame.addEventListener( 'load', () => {
			add( 'canvas load' );
			watch( frame.contentDocument, 'canvas' );
		} );
	} ).observe( document, { childList: true, subtree: true } );

	// Block selection and editor readiness.
	const timer = setInterval( () => {
		const data = window.wp && window.wp.data;
		if ( ! data || ! data.select( 'core/block-editor' ) ) {
			return;
		}
		clearInterval( timer );
		add( 'data ready' );
		let selected;
		let blocks = 0;
		data.subscribe( () => {
			const editor = data.select( 'core/block-editor' );
			const id = editor.getSelectedBlockClientId();
			const count = editor.getBlockCount();
			if ( id !== selected ) {
				selected = id;
				add( 'selected ' + ( id ? editor.getBlockName( id ) : 'none' ) );
			}
			if ( count !== blocks ) {
				blocks = count;
				add( 'blocks ' + count );
			}
		} );
	}, 20 );
} )();
