/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useState,
	createPortal,
	forwardRef,
	useMemo,
	useReducer,
	renderToString,
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
import { useCompatibilityStyles } from './use-compatibility-styles';
import { store as blockEditorStore } from '../../store';

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

	const eventTypes = [ 'dragover', 'mousemove' ];

	for ( const name of eventTypes ) {
		doc.addEventListener( name, bubbleEvent );
	}
}

function useParsedAssets( html ) {
	return useMemo( () => {
		const doc = document.implementation.createHTMLDocument( '' );
		doc.body.innerHTML = html;
		return Array.from( doc.body.children );
	}, [ html ] );
}

async function loadScript( head, { id, src } ) {
	return new Promise( ( resolve, reject ) => {
		const script = head.ownerDocument.createElement( 'script' );
		script.id = id;
		if ( src ) {
			script.src = src;
			script.onload = () => resolve();
			script.onerror = () => reject();
		} else {
			resolve();
		}
		head.appendChild( script );
	} );
}

function Iframe( {
	contentRef,
	children,
	head,
	tabIndex = 0,
	scale = 1,
	frameSize = 0,
	expand = false,
	readonly,
	forwardedRef: ref,
	...props
} ) {
	const assets = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().__unstableResolvedAssets,
		[]
	);
	const [ , forceRender ] = useReducer( () => ( {} ) );
	const [ iframeDocument, setIframeDocument ] = useState();
	const [ bodyClasses, setBodyClasses ] = useState( [] );
	const styles = useParsedAssets( assets?.styles );
	const styleIds = styles.map( ( style ) => style.id );
	const compatStyles = useCompatibilityStyles();
	const neededCompatStyles = compatStyles.filter(
		( style ) => ! styleIds.includes( style.id )
	);
	const scripts = useParsedAssets( assets?.scripts );
	const clearerRef = useBlockSelectionClearer();
	const [ before, writingFlowRef, after ] = useWritingFlow();
	const [ contentResizeListener, { height: contentHeight } ] =
		useResizeObserver();
	const setRef = useRefEffect( ( node ) => {
		let iFrameDocument;
		// Prevent the default browser action for files dropped outside of dropzones.
		function preventFileDropDefault( event ) {
			event.preventDefault();
		}
		function setDocumentIfReady() {
			const { contentDocument, ownerDocument } = node;
			const { readyState, documentElement } = contentDocument;
			iFrameDocument = contentDocument;

			if ( readyState !== 'interactive' && readyState !== 'complete' ) {
				return false;
			}

			bubbleEvents( contentDocument );
			setIframeDocument( contentDocument );
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
			documentElement.removeChild( contentDocument.head );
			documentElement.removeChild( contentDocument.body );

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
			return true;
		}

		// Document set with srcDoc is not immediately ready.
		node.addEventListener( 'load', setDocumentIfReady );

		return () => {
			node.removeEventListener( 'load', setDocumentIfReady );
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

	const headRef = useRefEffect( ( element ) => {
		scripts
			.reduce(
				( promise, script ) =>
					promise.then( () => loadScript( element, script ) ),
				Promise.resolve()
			)
			.finally( () => {
				// When script are loaded, re-render blocks to allow them
				// to initialise.
				forceRender();
			} );
	}, [] );
	const disabledRef = useDisabled( { isDisabled: ! readonly } );
	const bodyRef = useMergeRefs( [
		contentRef,
		clearerRef,
		writingFlowRef,
		disabledRef,
	] );

	const styleAssets = (
		<>
			<style>{ 'html{height:auto!important;}body{margin:0}' }</style>
			{ [ ...styles, ...neededCompatStyles ].map(
				( { tagName, href, id, rel, media, textContent } ) => {
					const TagName = tagName.toLowerCase();

					if ( TagName === 'style' ) {
						return (
							<TagName { ...{ id } } key={ id }>
								{ textContent }
							</TagName>
						);
					}

					return (
						<TagName { ...{ href, id, rel, media } } key={ id } />
					);
				}
			) }
		</>
	);

	// Correct doctype is required to enable rendering in standards
	// mode. Also preload the styles to avoid a flash of unstyled
	// content.
	const srcDoc = useMemo( () => {
		return '<!doctype html>' + renderToString( styleAssets );
	}, [] );

	// We need to counter the margin created by scaling the iframe. If the scale
	// is e.g. 0.45, then the top + bottom margin is 0.55 (1 - scale). Just the
	// top or bottom margin is 0.55 / 2 ((1 - scale) / 2).
	const marginFromScaling = ( contentHeight * ( 1 - scale ) ) / 2;

	return (
		<>
			{ tabIndex >= 0 && before }
			<iframe
				{ ...props }
				style={ {
					...props.style,
					height: expand ? contentHeight : props.style?.height,
					marginTop: scale
						? -marginFromScaling + frameSize
						: props.style?.marginTop,
					marginBottom: scale
						? -marginFromScaling + frameSize
						: props.style?.marginBottom,
					transform: scale
						? `scale( ${ scale } )`
						: props.style?.transform,
					transition: 'all .3s',
				} }
				ref={ useMergeRefs( [ ref, setRef ] ) }
				tabIndex={ tabIndex }
				// Correct doctype is required to enable rendering in standards
				// mode. Also preload the styles to avoid a flash of unstyled
				// content.
				srcDoc={ srcDoc }
				title={ __( 'Editor canvas' ) }
			>
				{ iframeDocument &&
					createPortal(
						<>
							<head ref={ headRef }>
								{ styleAssets }
								{ head }
							</head>
							<body
								ref={ bodyRef }
								className={ classnames(
									'block-editor-iframe__body',
									'editor-styles-wrapper',
									...bodyClasses
								) }
							>
								{ contentResizeListener }
								<StyleProvider document={ iframeDocument }>
									{ children }
								</StyleProvider>
							</body>
						</>,
						iframeDocument.documentElement
					) }
			</iframe>
			{ tabIndex >= 0 && after }
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
