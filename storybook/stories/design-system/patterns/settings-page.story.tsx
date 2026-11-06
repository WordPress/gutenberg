import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdjacentPagesExample } from './settings-page/adjacent-pages';
import { AdjacentPagesAndSubpagesExample } from './settings-page/adjacent-pages-and-subpages';
import { RecordsDialogExample } from './settings-page/records-dialog';
import { RecordsDrawerExample } from './settings-page/records-drawer';
import { RecordsSubpageExample } from './settings-page/records-subpage';
import { SimpleSettingsExample } from './settings-page/simple';
import { SubpagesExample } from './settings-page/subpages';

const meta: Meta = {
	title: 'Design System/Patterns/Settings Page',
	parameters: {
		controls: { disable: true },
		layout: 'fullscreen',
	},
	tags: [ 'docs-only' ],
};

export default meta;

type Story = StoryObj;

export const Simple: Story = {
	name: 'Simple settings page',
	render: () => <SimpleSettingsExample />,
};

export const AdjacentPages: Story = {
	name: 'Adjacent pages',
	render: () => <AdjacentPagesExample />,
};

export const Subpages: Story = {
	render: () => <SubpagesExample />,
};

export const AdjacentPagesAndSubpages: Story = {
	name: 'Adjacent pages and subpages',
	render: () => <AdjacentPagesAndSubpagesExample />,
};

export const RecordsWithSubpages: Story = {
	name: 'Records that open a subpage',
	render: () => <RecordsSubpageExample />,
};

export const RecordsWithDialog: Story = {
	name: 'Records that open a dialog',
	render: () => <RecordsDialogExample />,
};

export const RecordsWithDrawer: Story = {
	name: 'Records that open a drawer',
	render: () => <RecordsDrawerExample />,
};
