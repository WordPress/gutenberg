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
	useRef,
	useCallback,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	useResizeObserver,
	useMergeRefs,
	useRefEffect,
	useDisabled,
} from '@wordpress/compose';
import { __experimentalStyleProvider as StyleProvider } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockSelectionClearer } from '../block-selection-clearer';
import { useWritingFlow } from '../writing-flow';
import { getCompatibilityStyles } from './get-compatibility-styles';
import { store as blockEditorStore } from '../../store';

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
			isPreviewMode: settings.__unstableIsPreviewMode,
		};
	}, [] );
	const { styles = '', scripts = '' } = resolvedAssets;
	const [ iframeDocument, setIframeDocument ] = useState();
	const [ bodyClasses, setBodyClasses ] = useState( [] );
	const clearerRef = useBlockSelectionClearer();
	const [ before, writingFlowRef, after ] = useWritingFlow();
	const [ containerResizeListener, { width: containerWidth } ] =
		useResizeObserver();

	const setRef = useRefEffect( ( node ) => {
		node._load = () => {
			setIframeDocument( node.contentDocument );
		};
		let iFrameDocument;
		// Prevent the default browser action for files dropped outside of dropzones.
		function preventFileDropDefault( event ) {
			event.preventDefault();
		}
		function onLoad() {
			const { contentDocument, ownerDocument } = node;
			const { documentElement } = contentDocument;
			iFrameDocument = contentDocument;

			documentElement.classList.add( 'block-editor-iframe__html' );

			clearerRef( documentElement );

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

			contentDocument.dir = ownerDocument.dir;

			for ( const compatStyle of getCompatibilityStyles() ) {
				if ( contentDocument.getElementById( compatStyle.id ) ) {
					continue;
				}

				contentDocument.head.appendChild(
					compatStyle.cloneNode( true )
				);

				if ( ! isPreviewMode ) {
					// eslint-disable-next-line no-console
					console.warn(
						`${ compatStyle.id } was added to the iframe incorrectly. Please use block.json or enqueue_block_assets to add styles to the iframe.`,
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
		};
	}, [] );

	const isZoomedOut = scale !== 1;
	const shouldScaleToDefault = scale === 'default';

	const refZoomOutStatus = useRef( {
		priorContainerWidth: null,
		scale: null,
		timerId: -1,
		effect: null,
	} );

	const actualizeZoom = useCallback(
		( nextScale, inset ) => {
			if ( ! iframeDocument ) {
				return;
			}
			const { documentElement, defaultView } = iframeDocument;
			if ( nextScale < 1 ) {
				documentElement.classList.add( 'is-zoomed-out' );
				documentElement.style.setProperty(
					'--wp-block-editor-iframe-zoom-out-scale',
					nextScale
				);
				defaultView.frameElement.style.setProperty(
					'--wp-block-editor-iframe-zoom-out-scale',
					nextScale
				);
				defaultView.frameElement.style.setProperty(
					'--wp-block-editor-iframe-zoom-out-inset',
					inset === 'number' ? `${ inset }px` : inset
				);
			} else {
				documentElement.classList.remove( 'is-zoomed-out' );
				documentElement.style.removeProperty(
					'--wp-block-editor-iframe-zoom-out-scale'
				);
				defaultView.frameElement.style.removeProperty(
					'--wp-block-editor-iframe-zoom-out-scale'
				);
				defaultView.frameElement.style.removeProperty(
					'--wp-block-editor-iframe-zoom-out-inset'
				);
			}
		},
		[ iframeDocument ]
	);

	useEffect(
		() => {
			if ( ! shouldScaleToDefault ) {
				actualizeZoom( scale, frameSize );
				return;
			}
			refZoomOutStatus.current.priorContainerWidth = containerWidth;
			// Derives the scaling factor for 'default' scale as containerWidth changes
			// yet leaves it constant after the container’s automated resize completes.
			// This is so that container width changes caused by a user action like
			// browser window resizing should not change the scale.
			refZoomOutStatus.current.effect = ( isActive, nextWidth ) => {
				if ( isActive ) {
					const { priorContainerWidth } = refZoomOutStatus.current;
					actualizeZoom( nextWidth / priorContainerWidth, frameSize );
					clearTimeout( refZoomOutStatus.current.timerId );
					refZoomOutStatus.current.timerId = setTimeout( () => {
						refZoomOutStatus.current.effect = null;
					}, 250 );
				} else {
					clearTimeout( refZoomOutStatus.current.timerId );
				}
			};
		},
		// containerWidth is purposely omitted to memoize its value once
		// "default" scaling begins.
		[ actualizeZoom, frameSize, isZoomedOut, scale, shouldScaleToDefault ]
	);

	useEffect( () => {
		refZoomOutStatus.current.effect?.(
			shouldScaleToDefault,
			containerWidth
		);
	}, [ containerWidth, shouldScaleToDefault ] );

	const disabledRef = useDisabled( { isDisabled: ! readonly } );
	const bodyRef = useMergeRefs( [
		useBubbleEvents( iframeDocument ),
		contentRef,
		clearerRef,
		writingFlowRef,
		disabledRef,
	] );

	// Correct doctype is required to enable rendering in standards
	// mode. Also preload the styles to avoid a flash of unstyled
	// content.
	const html = `<!doctype html>
<html>
	<head>
		<meta charset="utf-8">
		<script>window.frameElement._load()</script>
		<style>
			html{
				height: auto !important;
				min-height: 100%;
			}
		</style>
		${ styles }
		${ scripts }
	</head>
	<body>
		<script>document.currentScript.parentElement.remove()</script>
	</body>
</html>`;

	const [ src, cleanup ] = useMemo( () => {
		const _src = URL.createObjectURL(
			new window.Blob( [ html ], { type: 'text/html' } )
		);
		return [ _src, () => URL.revokeObjectURL( _src ) ];
	}, [ html ] );

	useEffect( () => cleanup, [ cleanup ] );

	const { marginLeft, marginRight, ...styleWithoutInlineMargins } =
		props.style || {};
	// Omits inline margins for zoom out so static styles don’t need !important to override them.
	const usedStyle = ! isZoomedOut ? props.style : styleWithoutInlineMargins;

	// Make sure to not render the before and after focusable div elements in view
	// mode. They're only needed to capture focus in edit mode.
	const shouldRenderFocusCaptureElements = tabIndex >= 0 && ! isPreviewMode;

	return (
		<>
			{ containerResizeListener }
			{ shouldRenderFocusCaptureElements && before }
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */ }
			<iframe
				{ ...props }
				className={ clsx(
					props.className,
					isZoomedOut && 'is-zoomed-out'
				) }
				style={ { border: 0, ...usedStyle } }
				ref={ useMergeRefs( [ ref, setRef ] ) }
				tabIndex={ tabIndex }
				// Correct doctype is required to enable rendering in standards
				// mode. Also preload the styles to avoid a flash of unstyled
				// content.
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
						// We want to prevent React events from bubbling throught the iframe
						// we bubble these manually.
						/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
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
}

function IframeIfReady( props, ref ) {
	const isInitialised = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().__internalIsInitialized,
		[]
	);

	// We shouldn't render the iframe until the editor settings are initialised.
	// The initial settings are needed to get the styles for the srcDoc, which
	// cannot be changed after the iframe is mounted. srcDoc is used to to set
	// the initial iframe HTML, which is required to avoid a flash of unstyled
	// content.
	if ( ! isInitialised ) {
		return null;
	}

	return <Iframe { ...props } forwardedRef={ ref } />;
}

export default forwardRef( IframeIfReady );
