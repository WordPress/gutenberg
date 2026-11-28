import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilePickerUpload } from './file-picker-upload';

const meta = {
	title: 'Design System/Patterns/File Picker Upload',
	component: FilePickerUpload,
	tags: [ 'docs-only' ],
	parameters: { controls: { disable: true } },
} satisfies Meta< typeof FilePickerUpload >;

export default meta;

export const UploadStatus: StoryObj< typeof meta > = {};
