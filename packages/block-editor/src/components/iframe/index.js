/**
 * WordPress dependencies
 */
import {
	useState,
	createPortal,
	useCallback,
	forwardRef,
	useEffect,
	useMemo,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMergeRefs } from '@wordpress/compose';
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useBlockSelectionClearer } from '../block-selection-clearer';

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
			// eslint-disable-next-line no-console
			console.error(
				`Stylesheet ${ ownerNode.id } was not properly added.
For blocks, use the block API's style (https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#style) or editorStyle (https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#editor-style).
For themes, use add_editor_style (https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-support/#editor-styles).`,
				ownerNode
			);
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
		} else if ( name === 'wp-embed-responsive' ) {
			// Ideally ALL classes that are added through get_body_class should
			// be added in the editor too, which we'll somehow have to get from
			// the server in the future (which will run the PHP filters).
			doc.body.classList.add( 'wp-embed-responsive' );
		}
	}
}

function useParsedAssets( html ) {
	return useMemo( () => {
		const doc = document.implementation.createHTMLDocument( '' );
		doc.body.innerHTML = html;
		return Array.from( doc.body.children );
	}, [ html ] );
}

async function loadScript( doc, { id, src } ) {
	return new Promise( ( resolve, reject ) => {
		const script = doc.createElement( 'script' );
		script.id = id;
		if ( src ) {
			script.src = src;
			script.onload = () => resolve();
			script.onerror = () => reject();
		} else {
			resolve();
		}
		doc.head.appendChild( script );
	} );
}

function Iframe( { contentRef, children, head, ...props }, ref ) {
	const [ iframeDocument, setIframeDocument ] = useState();
	const styles = useParsedAssets( window.__editorAssets.styles );
	const scripts = useParsedAssets( window.__editorAssets.scripts );
	const clearerRef = useBlockSelectionClearer();
	const setRef = useCallback( ( node ) => {
		if ( ! node ) {
			return;
		}

		function setDocumentIfReady() {
			const { contentDocument } = node;
			const { readyState, body, documentElement } = contentDocument;

			if ( readyState !== 'interactive' && readyState !== 'complete' ) {
				return false;
			}

			if ( typeof contentRef === 'function' ) {
				contentRef( body );
			} else if ( contentRef ) {
				contentRef.current = body;
			}

			setBodyClassName( contentDocument );
			bubbleEvents( contentDocument );
			setBodyClassName( contentDocument );
			setIframeDocument( contentDocument );
			clearerRef( documentElement );
			clearerRef( body );

			scripts.reduce(
				( promise, script ) =>
					promise.then( () => loadScript( contentDocument, script ) ),
				Promise.resolve()
			);

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

	useEffect( () => {
		if ( iframeDocument ) {
			styleSheetsCompat( iframeDocument );
		}
	}, [ iframeDocument ] );

	head = (
		<>
			<style>{ 'body{margin:0}' }</style>
			{ styles.map( ( { tagName, href, id, rel, media }, index ) => {
				const TagName = tagName.toLowerCase();
				return (
					<TagName { ...{ href, id, rel, media } } key={ index } />
				);
			} ) }
			{ head }
		</>
	);

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
