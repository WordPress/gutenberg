import clsx from 'clsx';
import { version as reactVersion } from 'react';
import type {
	CSSProperties,
	EventHandler,
	ForwardedRef,
	IframeHTMLAttributes,
	Ref,
	SyntheticEvent,
} from 'react';
import { useState, createPortal, forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMergeRefs, useRefEffect, useDisabled } from '@wordpress/compose';
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useWritingFlow } from '../writing-flow';
import { getCompatibilityStyles } from './get-compatibility-styles';
import { useScaleCanvas } from './use-scale-canvas';
import { store as blockEditorStore } from '../../store';
import type { ResolvedAssets } from '../../store/types';
import type { EventConstructor, IframeProps } from './types';

/**
 * Events redispatched onto the outer `<iframe>` element.
 *
 * Native listeners attach inside the iframe document (`useBubbleEvents`).
 * Matching React portal bubbles are stopped so parents do not also see the
 * portal delivery.
 */
const BRIDGED_EVENTS = [
	{ native: 'dragover', react: 'onDragOver' },
	{ native: 'mousemove', react: 'onMouseMove' },
	{ native: 'pointerdown', react: 'onPointerDown' },
	{ native: 'mousedown', react: 'onMouseDown' },
	{ native: 'click', react: 'onClick' },
	{ native: 'keydown', react: 'onKeyDown' },
] as const satisfies ReadonlyArray< {
	native: string;
	react: keyof IframeHTMLAttributes< HTMLIFrameElement >;
} >;

type BridgedReactEvent = ( typeof BRIDGED_EVENTS )[ number ][ 'react' ];
type BridgedEventHandler =
	EventHandler< SyntheticEvent< HTMLIFrameElement > > | undefined;

/**
 * Resolves the parent-window event constructor that matches `event`.
 * Looks up by the event prototype's constructor name so the redispatched
 * event is created in this realm (not the iframe's).
 *
 * @param event Native or React synthetic event from the iframe document.
 */
function getEventConstructor( event: Event | SyntheticEvent ) {
	const constructorName = Object.getPrototypeOf( event ).constructor.name;
	return ( window as unknown as Record< string, EventConstructor > )[
		constructorName
	];
}

function bubbleEvent(
	event: Event | SyntheticEvent,
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

	const newEvent = new ( getEventConstructor( event ) )( event.type, init );
	if ( init.defaultPrevented ) {
		newEvent.preventDefault();
	}
	const cancelled = ! frame.dispatchEvent( newEvent );

	if ( cancelled ) {
		event.preventDefault();
	}
}

/**
 * Stops a React synthetic event that bubbled across the portal boundary from
 * the iframe document into the parent React tree.
 *
 * @param event React synthetic event that may have crossed documents.
 */
function stopReactPortalPropagation( event: SyntheticEvent ) {
	if (
		event.currentTarget.ownerDocument ===
		( event.target as Element ).ownerDocument
	) {
		return;
	}

	const { stopPropagation } = event.nativeEvent;
	event.nativeEvent.stopPropagation = () => {};
	event.stopPropagation();
	event.nativeEvent.stopPropagation = stopPropagation;
}

/**
 * React props that stop portal bubbles for redispatched events at the outer
 * `<iframe>`. Forwards any matching consumer handler first.
 *
 * @param props Iframe props that may include event handlers.
 */
function getPortalBoundaryEventProps( props: IframeProps ) {
	const boundaryProps = {} as Pick<
		IframeHTMLAttributes< HTMLIFrameElement >,
		BridgedReactEvent
	>;

	for ( const { react: propName } of BRIDGED_EVENTS ) {
		boundaryProps[ propName ] = ( event ) => {
			( props[ propName ] as BridgedEventHandler )?.( event );
			stopReactPortalPropagation( event );
		};
	}

	return boundaryProps;
}

/**
 * Bubbles selected native events from the iframe document onto the outer
 * `<iframe>` element so parent-document listeners can observe them.
 *
 * - `dragover` and `mousemove` keep drag-and-drop and pointer tracking working
 *   across the frame boundary.
 * - `pointerdown`, `mousedown`, and `click` let parent-document popups treat
 *   a canvas press as an outside press.
 * - `keydown` lets parent shortcuts see canvas keystrokes.
 *
 * Pair with `getPortalBoundaryEventProps` so React ancestors do not also
 * receive the portal-bubbled synthetic event for those same interactions.
 *
 * Ideally, we should remove the `keydown` event bubbling in the future.
 * Keyboard shortcuts should be context dependent, e.g. actions on blocks
 * like Cmd+A should not work globally outside the block editor.
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
		const handlers: Record< string, ( event: Event ) => void > = {};
		for ( const { native } of BRIDGED_EVENTS ) {
			handlers[ native ] = ( event ) => {
				bubbleEvent( event, frameElement as HTMLIFrameElement );
			};
			html.addEventListener( native, handlers[ native ] );
		}

		return () => {
			for ( const { native } of BRIDGED_EVENTS ) {
				html.removeEventListener( native, handlers[ native ] );
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

	const unguardedBodyRef = useMergeRefs( [
		useBubbleEvents( iframeDocument ),
		// `useMergeRefs` skips unset refs.
		contentRef as Ref< HTMLElement >,
		writingFlowRef,
		disabledRef,
		scaleContentRef,
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
			<iframe
				{ ...props }
				{ ...getPortalBoundaryEventProps( props ) }
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
		<div className="block-editor-iframe__container" ref={ containerRef }>
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
