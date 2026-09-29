import EditorFullPage from './fullpage';
import EditorBox from './box';
import EditorWithUndoRedo from './with-undo-redo';
import EditorZoomOut from './zoom-out';

export default {
	title: 'Playground/Block Editor',
	parameters: {
		sourceLink: 'storybook/stories/playground',
	},
};

export const _default = ( _args, { globals } ) => {
	return <EditorFullPage direction={ globals.direction } />;
};

_default.parameters = {
	sourceLink: 'storybook/stories/playground/fullpage/index.jsx',
};

export const Box = ( _args, { globals } ) => {
	return <EditorBox direction={ globals.direction } />;
};

Box.parameters = {
	sourceLink: 'storybook/stories/playground/box/index.jsx',
};

export const UndoRedo = ( _args, { globals } ) => {
	return <EditorWithUndoRedo direction={ globals.direction } />;
};

UndoRedo.parameters = {
	sourceLink: 'storybook/stories/playground/with-undo-redo/index.jsx',
};

export const ZoomOut = ( props ) => {
	return <EditorZoomOut { ...props } />;
};

ZoomOut.parameters = {
	sourceLink: 'storybook/stories/playground/zoom-out/index.jsx',
};
ZoomOut.argTypes = {
	zoomLevel: { control: { type: 'range', min: 10, max: 100, step: 5 } },
};
