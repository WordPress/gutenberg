import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyToClipboard } from '../index';
import { Button } from '../../button';

const meta: Meta< typeof CopyToClipboard > = {
	title: 'Design System/Components/CopyToClipboard',
	component: CopyToClipboard,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof CopyToClipboard >;

/**
 * `CopyToClipboard` is a render-prop wrapper. The child receives the current
 * copy status (`pending` or `success`) so it can update its content. Prefer
 * `ClipboardButton` when a ready-made control is enough.
 */
export const Default: Story = {
	args: {
		text: 'Text copied from CopyToClipboard',
	},
	render: ( args ) => (
		<CopyToClipboard { ...args }>
			{ ( status ) => (
				<Button variant="outline" tone="neutral">
					{ status === 'success' ? 'Copied!' : 'Copy' }
				</Button>
			) }
		</CopyToClipboard>
	),
};
