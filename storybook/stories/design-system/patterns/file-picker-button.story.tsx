import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilePickerButton } from './file-picker-button';

const meta = {
	title: 'Design System/Patterns/File Picker Button',
	component: FilePickerButton,
	tags: [ 'docs-only' ],
	parameters: { controls: { disable: true } },
} satisfies Meta< typeof FilePickerButton >;

export default meta;

export const ChooseFile: StoryObj< typeof meta > = {};
