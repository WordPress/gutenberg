import clsx from 'clsx';
import { version as reactVersion } from 'react';
import type { CSSProperties, ForwardedRef, Ref, SyntheticEvent } from 'react';
import { useState, createPortal, forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMergeRefs, useRefEffect, useDisabled } from '@wordpress/compose';
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { getScrollContainer } from '@wordpress/dom';
import { useWritingFlow } from '../writing-flow';
import { getCompatibilityStyles } from './get-compatibility-styles';
import { useScaleCanvas } from './use-scale-canvas';
import { store as blockEditorStore } from '../../store';
import type { ResolvedAssets } from '../../store/types';
import type { EventConstructor, IframeProps } from './types';

function bubbleEvent(
	event: Event | SyntheticEvent,
	Constructor: EventConstructor,
	frame: HTMLIFrameElement
) {
	const init: {
		clientX?: number;
		clientY?: number;
		defaultPrevented?: boolean;
		[ key: string ]: unknown;
	} = {};

	for ( const key in event ) {
		// Copies every enumerable property of the event.
		init[ key ] = ( event as unknown as Record< string, unknown > )[ key ];
	}

	// Check if the event is a MouseEvent generated within the iframe.
	// If so, adjust the coordinates to be relative to the position of
	// the iframe. This ensures that components such as Draggable
	// receive coordinates relative to the window, instead of relative
	// to the iframe. Without this, the Draggable event handler would
	// result in components "jumping" position as soon as the user
	// drags over the iframe.
	if (
		// A frame that dispatches events has a document and window.
		event instanceof
		( frame.contentDocument!.defaultView! as typeof window ).MouseEvent
	) {
		const rect = frame.getBoundingClientRect();
		// Mouse events have coordinates.
		init.clientX! += rect.left;
		init.clientY! += rect.top;
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
 * @param iframeDocument Document to attach listeners to.
 */
function useBubbleEvents( iframeDocument: Document | undefined ) {
	// @ts-expect-error Without dependencies the ref callback changes on every render.
	return useRefEffect( () => {
		// The body mounts once the document loads.
		const { defaultView } = iframeDocument!;
		if ( ! defaultView ) {
			return;
		}
		const { frameElement } = defaultView;
		const html = iframeDocument!.documentElement;
		const eventTypes = [ 'dragover', 'mousemove' ];
		const handlers: Record< string, ( event: Event ) => void > = {};
		for ( const name of eventTypes ) {
			handlers[ name ] = ( event ) => {
				const prototype = Object.getPrototypeOf( event );
				const constructorName = prototype.constructor.name;
				// The window has the constructors of the events it dispatches.
				const Constructor = (
					window as unknown as Record< string, EventConstructor >
				 )[ constructorName ];
				// The iframe window's frame is the iframe.
				bubbleEvent(
					event,
					Constructor,
					frameElement as HTMLIFrameElement
				);
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

const iframeSrcCache = new WeakMap< ResolvedAssets, string >();
const iframeSrcCleanup = globalThis.FinalizationRegistry
	? new globalThis.FinalizationRegistry< string >( ( url ) =>
			URL.revokeObjectURL( url )
		)
	: undefined;

function getIframeSrc( resolvedAssets: ResolvedAssets ) {
	let src = iframeSrcCache.get( resolvedAssets );
	if ( src ) {
		return src;
	}

	let body = '';
	if ( reactVersion.split( '.' )[ 0 ] === '18' ) {
		body =
			'<body><script>document.currentScript.parentElement.remove()</script></body>';
	}

	// Correct doctype is required to enable rendering in standards mode.
	// Also preload the styles to avoid a flash of unstyled content.
	const html = `<!doctype html>
<html>
	<head>
		<meta charset="utf-8">
		<base href="${ window.location.href }">
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
		${ resolvedAssets.styles ?? '' }
		${ resolvedAssets.scripts ?? '' }
	</head>
	${ body }
</html>`;

	src = URL.createObjectURL( new Blob( [ html ], { type: 'text/html' } ) );
	iframeSrcCache.set( resolvedAssets, src );
	iframeSrcCleanup?.register( resolvedAssets, src );
	return src;
}

function Iframe( {
	contentRef,
	children,
	tabIndex = 0,
	scale = 1,
	frameSize = 0,
	readonly,
	fitContent = false,
	forwardedRef: ref,
	title = __( 'Editor canvas' ),
	...props
}: IframeProps ) {
	const { resolvedAssets, isPreviewMode } = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return {
			resolvedAssets: settings.__unstableResolvedAssets,
			isPreviewMode: settings.isPreviewMode,
		};
	}, [] );
	const [ iframeDocument, setIframeDocument ] = useState< Document >();
	const [ bodyClasses, setBodyClasses ] = useState< string[] >( [] );
	const [ before, writingFlowRef, after ] = useWritingFlow();

	const setRef = useRefEffect< HTMLIFrameElement >( ( node ) => {
		let iFrameDocument: Document | undefined;
		// Prevent the default browser action for files dropped outside of dropzones.
		function preventFileDropDefault( event: DragEvent ) {
			event.preventDefault();
		}
		// Prevent clicks on link fragments from navigating away. Note that links
		// inside `contenteditable` are already disabled by the browser, so
		// this is for links in blocks outside of `contenteditable`.
		function interceptLinkClicks( event: MouseEvent ) {
			// Clicks reach the listener from elements.
			if (
				( event.target as Element ).tagName === 'A' &&
				( event.target as Element )
					.getAttribute( 'href' )
					?.startsWith( '#' )
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
				// The loaded document has a window, and the link an `href`.
				iFrameDocument!.defaultView!.location.hash = (
					event.target as Element
				 )
					.getAttribute( 'href' )!
					.slice( 1 );
			}
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

		function onLoad() {
			// A loaded iframe has a document.
			const { contentDocument } = node as { contentDocument: Document };
			const { documentElement } = contentDocument;
			iFrameDocument = contentDocument;
			setIframeDocument( contentDocument );

			documentElement.classList.add( 'block-editor-iframe__html' );

			contentDocument.dir = ownerDocument.dir;

			for ( const compatStyle of getCompatibilityStyles() ) {
				// Compatibility styles are elements with an ID.
				if (
					contentDocument.getElementById(
						( compatStyle as Element ).id
					)
				) {
					continue;
				}

				contentDocument.head.appendChild(
					compatStyle.cloneNode( true )
				);

				if ( ! isPreviewMode ) {
					// eslint-disable-next-line no-console
					console.warn(
						`${ ( compatStyle as Element ).id } was added to the iframe incorrectly. Please use block.json or enqueue_block_assets to add styles to the iframe.`,
						compatStyle
					);
				}
			}

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
			setIframeDocument( undefined );
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
		contentRef: scaleContentRef,
		containerRef,
		isZoomedOut,
		scaleContainerWidth,
	} = useScaleCanvas( {
		scale,
		// `parseInt` reads a number as its string form.
		frameSize: parseInt( frameSize as string ),
		// The canvas only animates once the iframe document loads.
		iframeDocument: iframeDocument as Document,
	} );

	const disabledRef = useDisabled( { isDisabled: ! readonly } );

	// `vh` is the iframe's layout viewport. Growing the iframe to its content
	// makes `vh` grow with it, so a Cover block set to 100vh expands the iframe
	// forever. The viewport stays the parent window's height, which is what
	// `vh` means on the front end. The container is a spacer as tall as the
	// document measured at that viewport, and the iframe sticks to the top of
	// the ancestor that scrolls. Scrolling that ancestor moves the document
	// inside the iframe, so whatever follows the spacer (the meta boxes) comes
	// into view with the content.
	const fitContentRef = useRefEffect< HTMLElement >(
		( body ) => {
			if ( ! fitContent ) {
				return;
			}
			const { ownerDocument } = body;
			// The body lives in the iframe document, which has a window and a frame.
			// `ResizeObserver` is a global of that window, not a property of `Window`.
			const { defaultView } = ownerDocument as {
				defaultView: Window & typeof globalThis;
			};
			const iframe = defaultView.frameElement as HTMLIFrameElement;
			const container = iframe.closest(
				'.block-editor-iframe__container'
			) as HTMLElement;
			const scrollContainer = getScrollContainer( container );
			const scrollingElement = ownerDocument.scrollingElement!;
			// One scrollbar: the ancestor's. The document still reports
			// scrollHeight, and assigning scrollTop still moves it.
			const { overflow } = scrollingElement.style;
			scrollingElement.style.overflow = 'hidden';

			// Where the spacer starts inside the ancestor, so the ancestor's
			// scroll position maps onto the document.
			const spacerOffset = () => {
				if ( ! scrollContainer ) {
					return 0;
				}
				return (
					container.getBoundingClientRect().top -
					scrollContainer.getBoundingClientRect().top +
					scrollContainer.scrollTop
				);
			};

			let measuredViewport = 0;
			let measuredContent = 0;
			const measure = () => {
				const viewport = defaultView.parent.innerHeight;
				// Set the viewport before reading, so `vh` resolves against it.
				container.style.setProperty(
					'--wp-block-editor-iframe-viewport-height',
					`${ viewport }px`
				);
				const contentHeight = Math.max(
					viewport,
					Math.ceil( scrollingElement.scrollHeight )
				);
				if (
					viewport === measuredViewport &&
					contentHeight === measuredContent
				) {
					return;
				}
				measuredViewport = viewport;
				measuredContent = contentHeight;
				container.style.setProperty(
					'--wp-block-editor-iframe-content-height',
					`${ contentHeight }px`
				);
			};

			// Phase 1: the iframe is stuck to the top, so the document scrolls
			// by the same amount as the ancestor. Phase 2: the iframe has
			// reached the bottom of the spacer and slides up; the document
			// stays at its end.
			let syncing = false;
			const syncScroll = () => {
				if ( ! scrollContainer ) {
					return;
				}
				const maxScroll = Math.max(
					0,
					scrollingElement.scrollHeight -
						defaultView.parent.innerHeight
				);
				const into = scrollContainer.scrollTop - spacerOffset();
				syncing = true;
				scrollingElement.scrollTop = Math.min(
					Math.max( 0, into ),
					maxScroll
				);
				syncing = false;
			};

			// A document that scrolled on its own before it fit would lose
			// that offset once it fits. Pass it on so the view stays put.
			const carried = scrollingElement.scrollTop;
			measure();
			if ( carried && scrollContainer ) {
				scrollContainer.scrollTop = spacerOffset() + carried;
			}
			syncScroll();

			const onContentChange = () => {
				measure();
				syncScroll();
			};
			const onCanvasScroll = () => {
				if ( syncing || ! scrollContainer ) {
					return;
				}
				scrollContainer.scrollTop =
					spacerOffset() + scrollingElement.scrollTop;
				syncScroll();
			};
			// Wheel events inside the iframe do not scroll the ancestor.
			const onWheel = ( event: WheelEvent ) => {
				if ( ! scrollContainer ) {
					return;
				}
				let delta = event.deltaY;
				// deltaMode 1 is lines, 2 is pages.
				if ( event.deltaMode === 1 ) {
					delta *= 16;
				} else if ( event.deltaMode === 2 ) {
					delta *= scrollContainer.clientHeight;
				}
				scrollContainer.scrollTop += delta;
				event.preventDefault();
			};

			const observer = new defaultView.ResizeObserver( onContentChange );
			observer.observe( body );
			defaultView.parent.addEventListener( 'resize', onContentChange );
			scrollContainer?.addEventListener( 'scroll', syncScroll );
			scrollingElement.addEventListener( 'scroll', onCanvasScroll );
			ownerDocument.addEventListener( 'wheel', onWheel, {
				passive: false,
			} );
			return () => {
				observer.disconnect();
				defaultView.parent.removeEventListener(
					'resize',
					onContentChange
				);
				scrollContainer?.removeEventListener( 'scroll', syncScroll );
				scrollingElement.removeEventListener(
					'scroll',
					onCanvasScroll
				);
				ownerDocument.removeEventListener( 'wheel', onWheel );
				scrollingElement.style.overflow = overflow;
				container.style.removeProperty(
					'--wp-block-editor-iframe-viewport-height'
				);
				container.style.removeProperty(
					'--wp-block-editor-iframe-content-height'
				);
			};
		},
		[ fitContent ]
	);

	const unguardedBodyRef = useMergeRefs( [
		useBubbleEvents( iframeDocument ),
		// `useMergeRefs` skips unset refs.
		contentRef as Ref< HTMLElement >,
		writingFlowRef,
		disabledRef,
		scaleContentRef,
		fitContentRef,
	] );

	// Attach the body ref only when the iframe document and window are available.
	// When an iframe element is moved in the DOM, like when reordering a list,
	// its `window` object is destroyed and recreated, and the `defaultView` field is
	// briefly `null`. We need to guard for such calls of the ref callbacks.
	const bodyRef = useRefEffect< HTMLElement >(
		( node ) => {
			if ( node.ownerDocument.defaultView ) {
				unguardedBodyRef( node );
				return () => unguardedBodyRef( null );
			}
			return () => {};
		},
		[ unguardedBodyRef ]
	);

	// The settings are initialized before the iframe renders.
	const src = getIframeSrc( resolvedAssets! );

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
				ref={ useMergeRefs( [
					// `useMergeRefs` skips unset refs.
					ref as Ref< HTMLIFrameElement >,
					setRef,
				] ) }
				tabIndex={ tabIndex }
				src={ src }
				title={ title }
				onKeyDown={ ( event ) => {
					if ( props.onKeyDown ) {
						props.onKeyDown( event );
					}
					// If the event originates from inside the iframe, it means
					// it bubbled through the portal, but only with React
					// events. We need to bubble native events as well,
					// though by doing so we also trigger another React event,
					// so we need to stop the propagation of this event to avoid
					// duplication.
					if (
						event.currentTarget.ownerDocument !==
						( event.target as Element ).ownerDocument
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
		<div
			className={ clsx(
				'block-editor-iframe__container',
				fitContent && 'is-fit-content'
			) }
			ref={ containerRef }
		>
			<div
				className={ clsx(
					'block-editor-iframe__scale-container',
					isZoomedOut && 'is-zoomed-out'
				) }
				style={
					{
						'--wp-block-editor-iframe-zoom-out-scale-container-width':
							isZoomedOut && `${ scaleContainerWidth }px`,
					} as CSSProperties
				}
			>
				{ iframe }
			</div>
		</div>
	);
}

function IframeIfReady(
	props: IframeProps,
	ref: ForwardedRef< HTMLIFrameElement >
) {
	const isInitialised = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().__internalIsInitialized,
		[]
	);

	// We shouldn't render the iframe until the editor settings are initialized.
	// The initial settings are needed to get the styles for the srcDoc, which
	// cannot be changed after the iframe is mounted. srcDoc is used to set
	// the initial iframe HTML, which is required to avoid a flash of unstyled
	// content.
	if ( ! isInitialised ) {
		return null;
	}

	return <Iframe { ...props } forwardedRef={ ref } />;
}

export default forwardRef( IframeIfReady );
