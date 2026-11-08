import type { CSSProperties, ReactNode, Ref } from 'react';
import type { EditorStylesProps } from '../editor-styles/types';
import type { IframeProps } from '../iframe/types';

export interface BlockCanvasProps {
	/** Canvas height, defaults to 300px. */
	height?: CSSProperties[ 'height' ];
	/** Content styles to inject into the iframe. */
	styles?: EditorStylesProps[ 'styles' ];
	/** Content of the canvas, defaults to the BlockList component. */
	children?: ReactNode;
}

export interface ExperimentalBlockCanvasProps extends BlockCanvasProps {
	shouldIframe?: boolean;
	contentRef?: Ref< HTMLElement >;
	iframeProps?: IframeProps;
}
