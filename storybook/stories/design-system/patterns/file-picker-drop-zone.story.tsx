import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilePickerDropZone } from './file-picker-drop-zone';

const meta = {
	title: 'Design System/Patterns/File Picker Drop Zone',
	component: FilePickerDropZone,
	tags: [ 'docs-only' ],
	args: { disabled: false },
} satisfies Meta< typeof FilePickerDropZone >;

export default meta;

export const ChooseFile: StoryObj< typeof meta > = {};
export const Disabled: StoryObj< typeof meta > = { args: { disabled: true } };
