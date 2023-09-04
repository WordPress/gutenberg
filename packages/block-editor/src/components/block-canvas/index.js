/**
 * Internal dependencies
 */
import BlockList from '../block-list';
import EditorStyles from '../editor-styles';
import Iframe from '../iframe';
import WritingFlow from '../writing-flow';
import { useMouseMoveTypingReset } from '../observe-typing';

function BlockCanvas( {
	shouldIframe = true,
	children = <BlockList />,
	styles,
	contentRef,
	iframeProps,
} ) {
	const resetTypingRef = useMouseMoveTypingReset();

	if ( ! shouldIframe ) {
		return (
			<>
				<EditorStyles styles={ styles } />
				<WritingFlow
					ref={ contentRef }
					className="editor-styles-wrapper"
					style={ { flex: '1' } }
					tabIndex={ -1 }
				>
					{ children }
				</WritingFlow>
			</>
		);
	}

	return (
		<Iframe
			{ ...iframeProps }
			ref={ resetTypingRef }
			contentRef={ contentRef }
			style={ {
				...iframeProps?.style,
				width: '100%',
				height: '100%',
				display: 'block',
			} }
			name="editor-canvas"
		>
			<EditorStyles styles={ styles } />
			{ children }
		</Iframe>
	);
}

export default BlockCanvas;
