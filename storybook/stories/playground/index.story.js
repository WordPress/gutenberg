/**
 * Internal dependencies
 */
import EditorFullPage from './fullpage';
import EditorBox from './box';
import EditorWithUndoRedo from './with-undo-redo';

export default {
	title: 'Playground/Block Editor',
	parameters: {
		sourceLink: 'storybook/stories/playground',
	},
};

export const _default = () => {
	return <EditorFullPage />;
};

_default.parameters = {
	sourceLink: 'storybook/stories/playground/fullpage/index.js',
};

export const Box = () => {
	return <EditorBox />;
};

Box.parameters = {
	sourceLink: 'storybook/stories/playground/box/index.js',
};

export const UndoRedo = () => {
	return <EditorWithUndoRedo />;
};

UndoRedo.parameters = {
	sourceLink: 'storybook/stories/playground/with-undo-redo/index.js',
};
