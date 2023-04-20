/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

export const DEFAULT_EDITOR_CANVAS_FILL_CONTEXT = {
	sizes: {
		height: null,
		width: null,
	},
};

export const EditorCanvasFillContext = createContext(
	DEFAULT_EDITOR_CANVAS_FILL_CONTEXT
);
