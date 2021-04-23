/**
 * WordPress dependencies
 */
import {
	useState,
	createPortal,
	useCallback,
	forwardRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMergeRefs } from '@wordpress/compose';
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';

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
function styleSheetsCompat( doc ) {
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
function bubbleEvents( doc ) {
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
function setBodyClassName( doc ) {
	doc.dir = document.dir;
	doc.body.className = BODY_CLASS_NAME;

	for ( const name of document.body.classList ) {
		if ( name.startsWith( 'admin-color-' ) ) {
			doc.body.classList.add( name );
		}
	}
}

/**
 * Sets the document head and default styles.
 *
 * @param {Document} doc  Document to set the head for.
 * @param {string}   head HTML to set as the head.
 */
function setHead( doc, head ) {
	doc.head.innerHTML =
		// Body margin must be overridable by themes.
		'<style>body{margin:0}</style>' + head;
}

function Iframe( { contentRef, children, head, headHTML, ...props }, ref ) {
	const [ iframeDocument, setIframeDocument ] = useState();

	const setRef = useCallback( ( node ) => {
		if ( ! node ) {
			return;
		}

		function setDocumentIfReady() {
			const { contentDocument } = node;
			const { readyState, body } = contentDocument;

			if ( readyState !== 'interactive' && readyState !== 'complete' ) {
				return false;
			}

			if ( typeof contentRef === 'function' ) {
				contentRef( body );
			} else if ( contentRef ) {
				contentRef.current = body;
			}

			setHead( contentDocument, headHTML );
			setBodyClassName( contentDocument );
			styleSheetsCompat( contentDocument );
			bubbleEvents( contentDocument );
			setBodyClassName( contentDocument );
			setIframeDocument( contentDocument );

			return true;
		}

		if ( setDocumentIfReady() ) {
			return;
		}

		// Document is not immediately loaded in Firefox.
		node.addEventListener( 'load', () => {
			setDocumentIfReady();
		} );
	}, [] );

	return (
		<iframe
			{ ...props }
			ref={ useMergeRefs( [ ref, setRef ] ) }
			tabIndex="0"
			title={ __( 'Editor canvas' ) }
			name="editor-canvas"
		>
			{ iframeDocument &&
				createPortal(
					<StyleProvider document={ iframeDocument }>
						{ children }
					</StyleProvider>,
					iframeDocument.body
				) }
			{ iframeDocument && createPortal( head, iframeDocument.head ) }
		</iframe>
	);
}

export default forwardRef( Iframe );
