import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilePickerPanel } from './file-picker-panel';

const meta = {
	title: 'Design System/Patterns/File Picker Panel',
	component: FilePickerPanel,
	tags: [ 'docs-only' ],
	parameters: { controls: { disable: true } },
} satisfies Meta< typeof FilePickerPanel >;

export default meta;

export const PanelDropTarget: StoryObj< typeof meta > = {};
