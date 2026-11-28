import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilePickerMultiple } from './file-picker-multiple';

const meta = {
	title: 'Design System/Patterns/File Picker Multiple',
	component: FilePickerMultiple,
	tags: [ 'docs-only' ],
	parameters: { controls: { disable: true } },
} satisfies Meta< typeof FilePickerMultiple >;

export default meta;

export const ChooseFiles: StoryObj< typeof meta > = {};
