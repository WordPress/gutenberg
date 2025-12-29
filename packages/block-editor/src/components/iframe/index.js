/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useState,
	createPortal,
	forwardRef,
	useMemo,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMergeRefs, useRefEffect, useDisabled } from '@wordpress/compose';
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useWritingFlow } from '../writing-flow';
import { getCompatibilityStyles } from './get-compatibility-styles';
import { useScaleCanvas } from './use-scale-canvas';
import { store as blockEditorStore } from '../../store';
import transformStyles from '../../utils/transform-styles';

// Shared cache for fetched CSS across all iframe instances
// This ensures we only fetch each stylesheet once, regardless of how many iframes exist
const sharedStylesCache = new Map();
let stylesFetchPromise = null;
let compatStylesCache = null;
let compatStylesFetchPromise = null;

// URL-level cache to prevent fetching the same CSS file twice
// even if it appears in both resolvedAssets and compatibility styles
const cssUrlCache = new Map();
const cssUrlFetchPromises = new Map();

// Fetch a single CSS file with caching
function fetchCssFile( href ) {
	// Check if already cached
	if ( cssUrlCache.has( href ) ) {
		return Promise.resolve( cssUrlCache.get( href ) );
	}

	// Check if already fetching
	if ( cssUrlFetchPromises.has( href ) ) {
		return cssUrlFetchPromises.get( href );
	}

	// Start fetching
	const fetchPromise = fetch( href )
		.then( ( response ) => response.text() )
		.then( ( css ) => {
			// Use transformStyles to rebase URLs
			const processedCss = transformStyles(
				[ { css, baseURL: href } ],
				'' // No wrapper selector needed
			)[ 0 ];
			cssUrlCache.set( href, processedCss );
			cssUrlFetchPromises.delete( href );
			return processedCss;
		} )
		.catch( () => {
			const fallbackCss = `/* Failed to load: ${ href } */`;
			cssUrlCache.set( href, fallbackCss );
			cssUrlFetchPromises.delete( href );
			return fallbackCss;
		} );

	cssUrlFetchPromises.set( href, fetchPromise );
	return fetchPromise;
}

/**
 * Process style elements (link/style tags) and return their CSS content.
 * Fetches external stylesheets and extracts inline styles.
 *
 * @param {Array<Element>} elements - Array of link or style elements
 * @param {Object}         options  - Additional metadata to include in results
 * @return {Promise<Array>} Promise resolving to array of style objects
 */
function processStyleElements( elements, options = {} ) {
	const cssPromises = Array.from( elements ).map( ( element ) => {
		// Handle inline <style> tags
		if ( element.tagName === 'STYLE' ) {
			return Promise.resolve( {
				type: 'inline',
				id: element.id || element.getAttribute( 'id' ),
				css: element.textContent,
				...options,
			} );
		}

		// Handle <link rel="stylesheet"> tags
		if ( element.tagName === 'LINK' ) {
			const href = element.getAttribute( 'href' );
			if ( ! href ) {
				return Promise.resolve( null );
			}

			return fetchCssFile( href ).then( ( css ) => ( {
				type: 'external',
				id: element.id || element.getAttribute( 'id' ),
				href,
				css,
				media: element.getAttribute( 'media' ) || 'all',
				...options,
			} ) );
		}

		return Promise.resolve( null );
	} );

	return Promise.all( cssPromises ).then( ( styles ) =>
		styles.filter( Boolean )
	);
}

// Fetch compatibility styles once and convert to inline CSS
async function fetchCompatibilityStyles() {
	if ( compatStylesCache ) {
		return compatStylesCache;
	}

	if ( compatStylesFetchPromise ) {
		return compatStylesFetchPromise;
	}

	const compatStyles = getCompatibilityStyles();

	compatStylesFetchPromise = processStyleElements( compatStyles ).then(
		( styles ) => {
			compatStylesCache = styles;
			compatStylesFetchPromise = null;
			return compatStylesCache;
		}
	);

	return compatStylesFetchPromise;
}

function bubbleEvent( event, Constructor, frame ) {
	const init = {};

	for ( const key in event ) {
		init[ key ] = event[ key ];
	}

	// Check if the event is a MouseEvent generated within the iframe.
	// If so, adjust the coordinates to be relative to the position of
	// the iframe. This ensures that components such as Draggable
	// receive coordinates relative to the window, instead of relative
	// to the iframe. Without this, the Draggable event handler would
	// result in components "jumping" position as soon as the user
	// drags over the iframe.
	if ( event instanceof frame.contentDocument.defaultView.MouseEvent ) {
		const rect = frame.getBoundingClientRect();
		init.clientX += rect.left;
		init.clientY += rect.top;
	}

	const newEvent = new Constructor( event.type, init );
	if ( init.defaultPrevented ) {
		newEvent.preventDefault();
	}
	const cancelled = ! frame.dispatchEvent( newEvent );

	if ( cancelled ) {
		event.preventDefault();
	}
}

/**
 * Bubbles some event types (keydown, keypress, and dragover) to parent document
 * document to ensure that the keyboard shortcuts and drag and drop work.
 *
 * Ideally, we should remove event bubbling in the future. Keyboard shortcuts
 * should be context dependent, e.g. actions on blocks like Cmd+A should not
 * work globally outside the block editor.
 *
 * @param {Document} iframeDocument Document to attach listeners to.
 */
function useBubbleEvents( iframeDocument ) {
	return useRefEffect( () => {
		const { defaultView } = iframeDocument;
		if ( ! defaultView ) {
			return;
		}
		const { frameElement } = defaultView;
		const html = iframeDocument.documentElement;
		const eventTypes = [ 'dragover', 'mousemove' ];
		const handlers = {};
		for ( const name of eventTypes ) {
			handlers[ name ] = ( event ) => {
				const prototype = Object.getPrototypeOf( event );
				const constructorName = prototype.constructor.name;
				const Constructor = window[ constructorName ];
				bubbleEvent( event, Constructor, frameElement );
			};
			html.addEventListener( name, handlers[ name ] );
		}

		return () => {
			for ( const name of eventTypes ) {
				html.removeEventListener( name, handlers[ name ] );
			}
		};
	} );
}

function Iframe( {
	contentRef,
	children,
	tabIndex = 0,
	scale = 1,
	frameSize = 0,
	readonly,
	forwardedRef: ref,
	title = __( 'Editor canvas' ),
	...props
} ) {
	const { resolvedAssets, isPreviewMode } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return {
			resolvedAssets: settings.__unstableResolvedAssets,
			isPreviewMode: settings.isPreviewMode,
		};
	}, [] );
	const { styles = '', scripts = '' } = resolvedAssets;
	/** @type {[Document, import('react').Dispatch<Document>]} */
	const [ iframeDocument, setIframeDocument ] = useState();
	const [ bodyClasses, setBodyClasses ] = useState( [] );
	const [ before, writingFlowRef, after ] = useWritingFlow();

	// Local state to trigger re-render when shared cache is populated
	const [ cachedStyles, setCachedStyles ] = useState( null );

	// Fetch all stylesheets ONCE using shared cache
	useEffect( () => {
		if ( ! styles ) {
			return;
		}

		const cacheKey = styles; // Use styles string as cache key

		// Check if already cached
		if ( sharedStylesCache.has( cacheKey ) ) {
			setCachedStyles( sharedStylesCache.get( cacheKey ) );
			return;
		}

		// If already fetching, wait for that promise
		if ( stylesFetchPromise ) {
			stylesFetchPromise.then( ( cssData ) => {
				setCachedStyles( cssData );
			} );
			return;
		}

		// Parse HTML string into DOM elements
		const tempDiv = document.createElement( 'div' );
		tempDiv.innerHTML = styles;
		const styleElements = [
			...tempDiv.querySelectorAll( 'link[rel="stylesheet"]' ),
			...tempDiv.querySelectorAll( 'style' ),
		];

		// Process all style elements using shared utility
		stylesFetchPromise = processStyleElements( styleElements ).then(
			( cssData ) => {
				sharedStylesCache.set( cacheKey, cssData );
				stylesFetchPromise = null;
				return cssData;
			}
		);

		stylesFetchPromise.then( ( cssData ) => {
			setCachedStyles( cssData );
		} );
	}, [ styles ] );

	// Inject cached CSS into each iframe as inline styles
	useEffect( () => {
		if ( ! iframeDocument || ! cachedStyles ) {
			return;
		}

		// Inject all cached CSS as inline <style> tags
		cachedStyles.forEach( ( styleData ) => {
			const styleElement = iframeDocument.createElement( 'style' );
			if ( styleData.id ) {
				styleElement.id = styleData.id;
			}
			if ( styleData.media && styleData.media !== 'all' ) {
				styleElement.media = styleData.media;
			}
			styleElement.textContent = styleData.css;
			iframeDocument.head.appendChild( styleElement );
		} );
	}, [ iframeDocument, cachedStyles ] );

	const setRef = useRefEffect( ( node ) => {
		node._load = () => {
			setIframeDocument( node.contentDocument );
		};
		let iFrameDocument;
		// Prevent the default browser action for files dropped outside of dropzones.
		function preventFileDropDefault( event ) {
			event.preventDefault();
		}

		const { ownerDocument } = node;

		// Ideally ALL classes that are added through get_body_class should
		// be added in the editor too, which we'll somehow have to get from
		// the server in the future (which will run the PHP filters).
		setBodyClasses(
			Array.from( ownerDocument.body.classList ).filter(
				( name ) =>
					name.startsWith( 'admin-color-' ) ||
					name.startsWith( 'post-type-' ) ||
					name === 'wp-embed-responsive'
			)
		);

		// Prevent clicks on link fragments from navigating away. Note that links
		// inside `contenteditable` are already disabled by the browser, so
		// this is for links in blocks outside of `contenteditable`.
		function interceptLinkClicks( event ) {
			if (
				event.target.tagName === 'A' &&
				event.target.getAttribute( 'href' )?.startsWith( '#' )
			) {
				event.preventDefault();
				// Manually handle link fragment navigation within the iframe. The iframe's
				// location is a blob URL, which can't be used to resolve relative links like
				// `#hash`. The relative link would be resolved against the iframe's base URL
				// or the parent frame's URL, causing the iframe to navigate to a completely
				// different page. Setting the `location.hash` works because it really sets the
				// blob URL's hash.
				//
				// Links with fragments are used for example with footnotes. Clicking on these
				// links will scroll smoothly to the anchors in the editor canvas.
				iFrameDocument.defaultView.location.hash = event.target
					.getAttribute( 'href' )
					.slice( 1 );
			}
		}

		function onLoad() {
			const { contentDocument } = node;
			const { documentElement } = contentDocument;
			iFrameDocument = contentDocument;

			documentElement.classList.add( 'block-editor-iframe__html' );

			contentDocument.dir = ownerDocument.dir;

			// Fetch and inject compatibility styles as inline CSS to avoid duplicate requests
			fetchCompatibilityStyles().then( ( compatStyles ) => {
				compatStyles.forEach( ( { id, css } ) => {
					if ( contentDocument.getElementById( id ) ) {
						return;
					}

					const styleElement =
						contentDocument.createElement( 'style' );
					styleElement.id = id;
					styleElement.textContent = css;
					contentDocument.head.appendChild( styleElement );

					if ( ! isPreviewMode ) {
						// eslint-disable-next-line no-console
						console.warn(
							`${ id } was added to the iframe incorrectly. Please use block.json or enqueue_block_assets to add styles to the iframe.`,
							styleElement
						);
					}
				} );
			} );

			iFrameDocument.addEventListener(
				'dragover',
				preventFileDropDefault,
				false
			);
			iFrameDocument.addEventListener(
				'drop',
				preventFileDropDefault,
				false
			);
			iFrameDocument.addEventListener( 'click', interceptLinkClicks );
		}

		node.addEventListener( 'load', onLoad );

		return () => {
			delete node._load;
			node.removeEventListener( 'load', onLoad );
			iFrameDocument?.removeEventListener(
				'dragover',
				preventFileDropDefault
			);
			iFrameDocument?.removeEventListener(
				'drop',
				preventFileDropDefault
			);
			iFrameDocument?.removeEventListener( 'click', interceptLinkClicks );
		};
	}, [] );

	const {
		contentResizeListener,
		containerResizeListener,
		isZoomedOut,
		scaleContainerWidth,
	} = useScaleCanvas( {
		scale,
		frameSize: parseInt( frameSize ),
		iframeDocument,
	} );

	const disabledRef = useDisabled( { isDisabled: ! readonly } );
	const bodyRef = useMergeRefs( [
		useBubbleEvents( iframeDocument ),
		contentRef,
		writingFlowRef,
		disabledRef,
	] );

	// Correct doctype is required to enable rendering in standards mode.
	// Styles are injected after load to avoid duplicate requests from each iframe.
	// Using blob URL to get proper window.location for hash links.
	const html = useMemo(
		() => `<!doctype html>
<html>
	<head>
		<meta charset="utf-8">
		<base href="${ window.location.href }">
		<script>window.frameElement._load()</script>
		<style>
			html{
				height: auto !important;
				min-height: 100%;
			}
			/* Lowest specificity to not override global styles */
			:where(body) {
				margin: 0;
				/* Default background color in case zoom out mode background
				colors the html element */
				background-color: white;
			}
		</style>
		${ scripts }
	</head>
	<body>
		<script>document.currentScript.parentElement.remove()</script>
	</body>
</html>`,
		[ scripts ]
	);

	const [ src, cleanup ] = useMemo( () => {
		const blob = new window.Blob( [ html ], { type: 'text/html' } );
		const _src = URL.createObjectURL( blob );
		return [ _src, () => URL.revokeObjectURL( _src ) ];
	}, [ html ] );

	useEffect( () => cleanup, [ cleanup ] );

	// Make sure to not render the before and after focusable div elements in view
	// mode. They're only needed to capture focus in edit mode.
	const shouldRenderFocusCaptureElements = tabIndex >= 0 && ! isPreviewMode;

	const iframe = (
		<>
			{ shouldRenderFocusCaptureElements && before }
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */ }
			<iframe
				{ ...props }
				style={ {
					...props.style,
					height: props.style?.height,
					border: 0,
				} }
				ref={ useMergeRefs( [ ref, setRef ] ) }
				tabIndex={ tabIndex }
				// Using blob URL with inline CSS injection to avoid duplicate requests.
				// Blob URL gives us proper window.location for hash links.
				// CSS is fetched once and injected as inline styles via JavaScript.
				src={ src }
				title={ title }
				onKeyDown={ ( event ) => {
					if ( props.onKeyDown ) {
						props.onKeyDown( event );
					}
					// If the event originates from inside the iframe, it means
					// it bubbled through the portal, but only with React
					// events. We need to to bubble native events as well,
					// though by doing so we also trigger another React event,
					// so we need to stop the propagation of this event to avoid
					// duplication.
					if (
						event.currentTarget.ownerDocument !==
						event.target.ownerDocument
					) {
						// We should only stop propagation of the React event,
						// the native event should further bubble inside the
						// iframe to the document and window.
						// Alternatively, we could consider redispatching the
						// native event in the iframe.
						const { stopPropagation } = event.nativeEvent;
						event.nativeEvent.stopPropagation = () => {};
						event.stopPropagation();
						event.nativeEvent.stopPropagation = stopPropagation;
						bubbleEvent(
							event,
							window.KeyboardEvent,
							event.currentTarget
						);
					}
				} }
			>
				{ iframeDocument &&
					createPortal(
						<body
							ref={ bodyRef }
							className={ clsx(
								'block-editor-iframe__body',
								'editor-styles-wrapper',
								...bodyClasses
							) }
						>
							{ contentResizeListener }
							<StyleProvider document={ iframeDocument }>
								{ children }
							</StyleProvider>
						</body>,
						iframeDocument.documentElement
					) }
			</iframe>
			{ shouldRenderFocusCaptureElements && after }
		</>
	);

	return (
		<div className="block-editor-iframe__container">
			{ containerResizeListener }
			<div
				className={ clsx(
					'block-editor-iframe__scale-container',
					isZoomedOut && 'is-zoomed-out'
				) }
				style={ {
					'--wp-block-editor-iframe-zoom-out-scale-container-width':
						isZoomedOut && `${ scaleContainerWidth }px`,
				} }
			>
				{ iframe }
			</div>
		</div>
	);
}

function IframeIfReady( props, ref ) {
	const isInitialised = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().__internalIsInitialized,
		[]
	);

	// We shouldn't render the iframe until the editor settings are initialised.
	// The initial settings are needed to get the styles for the iframe, which
	// are injected after the iframe is mounted. Using blob URL with inline CSS
	// injection avoids duplicate requests while maintaining proper window.location.
	if ( ! isInitialised ) {
		return null;
	}

	return <Iframe { ...props } forwardedRef={ ref } />;
}

export default forwardRef( IframeIfReady );
