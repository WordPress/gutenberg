import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilePickerImport } from './file-picker-import';

const meta = {
	title: 'Design System/Patterns/File Picker Import',
	component: FilePickerImport,
	tags: [ 'docs-only' ],
	parameters: { controls: { disable: true } },
} satisfies Meta< typeof FilePickerImport >;

export default meta;

export const ImportOnChoose: StoryObj< typeof meta > = {};
