/**
 * Adapts the classic edit screen to rendering inside a meta boxes iframe
 * under the block editor. Printed inline into the loader document by
 * meta-box-iframe.php; not registered or enqueued anywhere.
 */
( () => {
	if ( window.parent === window ) {
		return;
	}

	const isSide =
		new URLSearchParams( window.location.search ).get(
			'gutenberg-meta-box-iframe'
		) === 'side';
	const parentData = () => window.parent.wp && window.parent.wp.data;

	// The parent editor saves through its own flow. Cancels at the capture
	// phase, which no other handler can prevent; canceling does not stop
	// the event, so meta box submit handlers still run.
	document.addEventListener(
		'submit',
		( event ) => {
			event.preventDefault();
		},
		{ capture: true }
	);

	// Hides the meta boxes hidden through the editor's Preferences before
	// anything renders. The style is replaced with the authoritative state
	// once the boxes exist.
	const earlyStyle = document.createElement( 'style' );
	try {
		const inactivePanels =
			parentData()
				.select( 'core/preferences' )
				.get( 'core', 'inactivePanels' ) || [];
		earlyStyle.textContent = inactivePanels
			.filter( ( panel ) => panel.startsWith( 'meta-box-' ) )
			.map(
				( panel ) =>
					`#${ window.CSS.escape(
						panel.slice( 'meta-box-'.length )
					) } { display: none; }`
			)
			.join( '\n' );
		document.head.appendChild( earlyStyle );
	} catch {
		// The parent editor is not there; leave visibility as rendered.
	}

	window.addEventListener( 'DOMContentLoaded', () => {
		const data = parentData();
		if ( data ) {
			// The block editor's visibility preference decides alone, so
			// the class is toggled both ways: the classic Screen Options
			// hidden state the server renders does not apply here.
			const applyVisibility = () => {
				for ( const box of document.querySelectorAll( '.postbox' ) ) {
					box.classList.toggle(
						'hide-if-js',
						! data
							.select( 'core/editor' )
							.isEditorPanelEnabled( `meta-box-${ box.id }` )
					);
				}
			};
			applyVisibility();
			earlyStyle.remove();
			const unsubscribe = data.subscribe(
				applyVisibility,
				'core/preferences'
			);
			window.addEventListener( 'pagehide', unsubscribe );
		}

		// The sidebar provides no fixed pane, so this document sizes its
		// own frame to the content.
		if ( isSide && window.frameElement ) {
			const applyHeight = () => {
				window.frameElement.style.height = `${ document.documentElement.offsetHeight }px`;
			};
			new window.ResizeObserver( applyHeight ).observe(
				document.documentElement
			);
			applyHeight();
		}
	} );

	// Width based media queries are rewritten to answer for the parent
	// window: the iframe is as wide as its pane, but the styles should
	// break to small screen layouts only when the user's window does.
	const dimensionQuery =
		/\(\s*(?:min-|max-)?(?:width|height|aspect-ratio|device-width|device-height)/;

	const controlMediaList = ( mediaList ) => {
		const condition = mediaList.mediaText;
		if ( ! dimensionQuery.test( condition ) ) {
			return;
		}
		const parentQuery = window.parent.matchMedia( condition );
		const apply = () => {
			mediaList.mediaText = parentQuery.matches ? 'all' : 'not all';
		};
		parentQuery.addEventListener( 'change', apply );
		apply();
	};

	const processRules = ( rules ) => {
		for ( const rule of rules ) {
			if ( rule.media ) {
				controlMediaList( rule.media );
			}
			try {
				// @import rules pull in their own sheet.
				if ( rule.styleSheet ) {
					processRules( rule.styleSheet.cssRules );
				}
			} catch {
				// Cross origin sheet.
			}
			if ( rule.cssRules ) {
				processRules( rule.cssRules );
			}
		}
	};

	const processed = new WeakSet();
	const processStyleSheets = () => {
		for ( const sheet of document.styleSheets ) {
			if ( processed.has( sheet ) ) {
				continue;
			}
			try {
				// Throws for cross origin sheets.
				const rules = sheet.cssRules;
				processed.add( sheet );
				if ( sheet.media.mediaText ) {
					controlMediaList( sheet.media );
				}
				processRules( rules );
			} catch {
				// Leave the sheet as is.
			}
		}
	};

	const observer = new window.MutationObserver( ( mutations ) => {
		let sheetsChanged = false;
		for ( const mutation of mutations ) {
			for ( const node of mutation.addedNodes ) {
				if ( node.nodeName === 'STYLE' ) {
					sheetsChanged = true;
				}
				if ( node.nodeName === 'LINK' ) {
					sheetsChanged = true;
					node.addEventListener( 'load', processStyleSheets, {
						once: true,
					} );
				}
			}
		}
		if ( sheetsChanged ) {
			processStyleSheets();
		}
	} );
	observer.observe( document.documentElement, {
		childList: true,
		subtree: true,
	} );
	window.addEventListener( 'load', processStyleSheets );
	processStyleSheets();

	// Scripts should branch on the parent window's size too.
	const iframeMatchMedia = window.matchMedia.bind( window );
	window.matchMedia = ( query ) =>
		dimensionQuery.test( query )
			? window.parent.matchMedia( query )
			: iframeMatchMedia( query );
} )();
