/**
 * WordPress dependencies
 */
import { useMergeRefs, useViewportMatch } from '@wordpress/compose';
import { useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockList from '../block-list';
import BlockTools from '../block-tools';
import EditorStyles from '../editor-styles';
import Iframe from '../iframe';
import WritingFlow from '../writing-flow';
import { useMouseMoveTypingReset } from '../observe-typing';
import { useBlockSelectionClearer } from '../block-selection-clearer';
import { useBlockCommands } from '../use-block-commands';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export const BlockCanvasCover = createSlotFill( Symbol( 'BlockCanvasCover' ) );

function BlockCanvasCoverWrapper( { children } ) {
	return (
		<div
			className="block-canvas-cover"
			style={ {
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
			} }
		>
			{ children }
		</div>
	);
}

// EditorStyles is a memoized component, so avoid passing a new
// object reference on each render.
const EDITOR_STYLE_TRANSFORM_OPTIONS = {
	// Don't transform selectors that already specify `.editor-styles-wrapper`.
	ignoredSelectors: [ /\.editor-styles-wrapper/gi ],
};

export function ExperimentalBlockCanvas( {
	shouldIframe = true,
	height = '300px',
	children = <BlockList />,
	styles,
	contentRef: contentRefProp,
	iframeProps,
} ) {
	useBlockCommands();
	const isTabletViewport = useViewportMatch( 'medium', '<' );
	const resetTypingRef = useMouseMoveTypingReset();
	const clearerRef = useBlockSelectionClearer();
	const localRef = useRef();
	const contentRef = useMergeRefs( [ contentRefProp, clearerRef, localRef ] );
	const zoomLevel = useSelect(
		( select ) => unlock( select( blockEditorStore ) ).getZoomLevel(),
		[]
	);
	const zoomOutIframeProps =
		zoomLevel !== 100 && ! isTabletViewport
			? {
					scale: zoomLevel,
					frameSize: '40px',
			  }
			: {};

	if ( ! shouldIframe ) {
		return (
			<BlockTools
				__unstableContentRef={ localRef }
				style={ { height, display: 'flex' } }
			>
				<BlockCanvasCover.Slot fillProps={ { containerRef: localRef } }>
					{ ( covers ) =>
						covers.map( ( cover, index ) => (
							<BlockCanvasCoverWrapper key={ index }>
								{ cover }
							</BlockCanvasCoverWrapper>
						) )
					}
				</BlockCanvasCover.Slot>
				<EditorStyles
					styles={ styles }
					scope=":where(.editor-styles-wrapper)"
					transformOptions={ EDITOR_STYLE_TRANSFORM_OPTIONS }
				/>
				<WritingFlow
					ref={ contentRef }
					className="editor-styles-wrapper"
					tabIndex={ -1 }
					style={ {
						height: '100%',
						width: '100%',
						overflow: 'auto',
					} }
				>
					{ children }
				</WritingFlow>
			</BlockTools>
		);
	}

	return (
		<BlockTools
			__unstableContentRef={ localRef }
			style={ { height, display: 'flex' } }
		>
			<Iframe
				{ ...iframeProps }
				{ ...zoomOutIframeProps }
				ref={ resetTypingRef }
				contentRef={ contentRef }
				style={ {
					...iframeProps?.style,
				} }
				name="editor-canvas"
			>
				<BlockCanvasCover.Slot fillProps={ { containerRef: localRef } }>
					{ ( covers ) =>
						covers.map( ( cover, index ) => (
							<BlockCanvasCoverWrapper key={ index }>
								{ cover }
							</BlockCanvasCoverWrapper>
						) )
					}
				</BlockCanvasCover.Slot>
				<EditorStyles styles={ styles } />
				{ children }
			</Iframe>
		</BlockTools>
	);
}

/**
 * BlockCanvas component is a component used to display the canvas of the block editor.
 * What we call the canvas is an iframe containing the block list that you can manipulate.
 * The component is also responsible of wiring up all the necessary hooks to enable
 * the keyboard navigation across blocks in the editor and inject content styles into the iframe.
 *
 * @example
 *
 * ```jsx
 * function MyBlockEditor() {
 *   const [ blocks, updateBlocks ] = useState([]);
 *   return (
 *     <BlockEditorProvider
 *       value={ blocks }
 *       onInput={ updateBlocks }
 *       onChange={ persistBlocks }
 *      >
 *        <BlockCanvas height="400px" />
 *      </BlockEditorProvider>
 *    );
 * }
 * ```
 *
 * @param {Object}  props          Component props.
 * @param {string}  props.height   Canvas height, defaults to 300px.
 * @param {Array}   props.styles   Content styles to inject into the iframe.
 * @param {Element} props.children Content of the canvas, defaults to the BlockList component.
 * @return {Element}               Block Breadcrumb.
 */
function BlockCanvas( { children, height, styles } ) {
	return (
		<ExperimentalBlockCanvas height={ height } styles={ styles }>
			{ children }
		</ExperimentalBlockCanvas>
	);
}

export default BlockCanvas;
