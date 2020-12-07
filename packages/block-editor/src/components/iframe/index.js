/**
 * WordPress dependencies
 */
import { useState, useEffect, createPortal, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useResizeObserver } from '@wordpress/compose';

const BODY_CLASS_NAME = 'editor-styles-wrapper';
const BLOCK_PREFIX = 'wp-block';

/**
 * Clones stylesheets targetting the editor canvas to the given document. A
 * stylesheet is considered targetting the editor a canvas if it contains the
 * `editor-styles-wrapper`, `wp-block`, or `wp-block-*` class selectors.
 *
 * Ideally, this hook should be removed in the future and styles should be added
 * explicitly as editor styles.
 *
 * @param {Document} doc The document to append cloned stylesheets to.
 */
function useStyleSheetsCompat( doc ) {
	useEffect( () => {
		// Search the document for stylesheets targetting the editor canvas.
		Array.from( document.styleSheets ).forEach( ( styleSheet ) => {
			try {
				// May fail for external styles.
				// eslint-disable-next-line no-unused-expressions
				styleSheet.cssRules;
			} catch ( e ) {
				return;
			}

			const { ownerNode, cssRules } = styleSheet;

			if ( ! cssRules ) {
				return;
			}

			const isMatch = Array.from( cssRules ).find(
				( { selectorText } ) =>
					selectorText &&
					( selectorText.includes( `.${ BODY_CLASS_NAME }` ) ||
						selectorText.includes( `.${ BLOCK_PREFIX }` ) )
			);

			if ( isMatch && ! doc.getElementById( ownerNode.id ) ) {
				doc.head.appendChild( ownerNode.cloneNode( true ) );
			}
		} );
	}, [] );
}

/**
 * Bubbles some event types (keydown, keypress, and dragover) to parent document
 * document to ensure that the keyboard shortcuts and drag and drop work.
 *
 * Ideally, we should remove event bubbling in the future. Keyboard shortcuts
 * should be context dependent, e.g. actions on blocks like Cmd+A should not
 * work globally outside the block editor.
 *
 * @param {Document} doc Document to attach listeners to.
 */
function useBubbleEvents( doc ) {
	useEffect( () => {
		const { defaultView } = doc;
		const { frameElement } = defaultView;

		function bubbleEvent( event ) {
			const prototype = Object.getPrototypeOf( event );
			const constructorName = prototype.constructor.name;
			const Constructor = window[ constructorName ];

			const init = {};

			for ( const key in event ) {
				init[ key ] = event[ key ];
			}

			if ( event instanceof defaultView.MouseEvent ) {
				const rect = frameElement.getBoundingClientRect();
				init.clientX += rect.left;
				init.clientY += rect.top;
			}

			const newEvent = new Constructor( event.type, init );
			const cancelled = ! frameElement.dispatchEvent( newEvent );

			if ( cancelled ) {
				event.preventDefault();
			}
		}

		const eventTypes = [ 'keydown', 'keypress', 'dragover' ];

		for ( const name of eventTypes ) {
			doc.addEventListener( name, bubbleEvent );
		}

		return () => {
			for ( const name of eventTypes ) {
				doc.removeEventListener( name, bubbleEvent );
			}
		};
	}, [] );
}

/**
 * Sets the document direction.
 *
 * Sets the `editor-styles-wrapper` class name on the body.
 *
 * Copies the `admin-color-*` class name to the body so that the admin color
 * scheme applies to components in the iframe.
 *
 * @param {Document} doc Document to add class name to.
 */
function useBodyClassName( doc ) {
	useEffect( () => {
		doc.dir = document.dir;
		doc.body.className = BODY_CLASS_NAME;

		for ( const name of document.body.classList ) {
			if ( name.startsWith( 'admin-color-' ) ) {
				doc.body.classList.add( name );
			}
		}
	}, [] );
}

/**
 * Positions the body element so that the resize listener works correctly. We're
 * using an absolute position here because the resize listener doesn't seem to
 * report shrinking when the position is relative, causing the iframe not to
 * shrink when content is removed.
 *
 * @see https://github.com/FezVrasta/react-resize-aware#usage
 *
 * @param {Document} doc Document to set styles to.
 */
function useResizeListenerCompat( doc ) {
	useEffect( () => {
		// Necessary for the resize listener to work correctly.
		doc.body.style.position = 'absolute';
		doc.body.style.right = '0';
		doc.body.style.left = '0';
	}, [] );
}

/**
 * Sets the document head and default styles.
 *
 * @param {Document} doc  Document to set the head for.
 * @param {string}   head HTML to set as the head.
 */
function useHead( doc, head ) {
	useEffect( () => {
		doc.head.innerHTML =
			// Body margin must be overridable by themes.
			'<style>body{margin:0}</style>' +
			'<style>.wp-block[data-align="full"],.wp-block.alignfull{max-width:100vw!important;width:100vw!important;}</style>' +
			head;
	}, [] );
}

function IframeContent( { doc, head, children } ) {
	useHead( doc, head );
	useStyleSheetsCompat( doc );
	useBubbleEvents( doc );
	useBodyClassName( doc );
	useResizeListenerCompat( doc );
	return createPortal( children, doc.body );
}

export default function Iframe( { children, head, style = {}, ...props } ) {
	const [ resizeListener, sizes ] = useResizeObserver();
	const [ contentDocument, setContentDocument ] = useState();
	const ref = useRef();

	function setDocumentIfReady( doc ) {
		const { readyState } = doc;

		if ( readyState === 'interactive' || readyState === 'complete' ) {
			setContentDocument( doc );
		}
	}

	useEffect( () => {
		setDocumentIfReady( ref.current.contentDocument );
	}, [] );

	function setRef( newRef ) {
		ref.current = newRef;

		if ( newRef ) {
			setDocumentIfReady( newRef.contentDocument );
		}
	}

	return (
		<iframe
			{ ...props }
			style={ {
				display: 'block',
				width: '100%',
				height: sizes.height + 'px',
				minHeight: '100%',
				...style,
			} }
			ref={ setRef }
			tabIndex="0"
			title={ __( 'Editor canvas' ) }
			name="editor-canvas"
			onLoad={ () => {
				// Document is not immediately loaded in Firefox.
				setDocumentIfReady( ref.current.contentDocument );
			} }
		>
			{ contentDocument && (
				<IframeContent doc={ contentDocument } head={ head }>
					{ children( { current: contentDocument.body } ) }
					{ resizeListener }
				</IframeContent>
			) }
		</iframe>
	);
}
