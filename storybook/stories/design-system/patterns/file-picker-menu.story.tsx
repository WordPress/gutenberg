import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilePickerMenu } from './file-picker-menu';

const meta = {
	title: 'Design System/Patterns/File Picker Menu',
	component: FilePickerMenu,
	tags: [ 'docs-only' ],
	parameters: { controls: { disable: true } },
} satisfies Meta< typeof FilePickerMenu >;

export default meta;

export const ChooseFile: StoryObj< typeof meta > = {};
