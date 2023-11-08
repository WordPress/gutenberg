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

export const Box = () => {
	return <EditorBox />;
};

export const UndoRedo = () => {
	return <EditorWithUndoRedo />;
};
