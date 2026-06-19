/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { Snackbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { UPLOAD_DONE, UPLOAD_SPINNER } from '../index';

/**
 * The `UploadProgressSnackbar` component itself renders no UI: it manages a
 * snackbar notice via the notices store while media uploads are in progress.
 *
 * These stories render the `Snackbar` with the same icon markup and text the
 * notice produces, so the in-progress and completed states can be reviewed
 * visually without running an actual upload.
 */
const meta: Meta< typeof Snackbar > = {
	title: 'Editor/UploadProgressSnackbar',
	component: Snackbar,
	parameters: {
		docs: { canvas: { sourceState: 'shown' } },
	},
	argTypes: {
		icon: { control: false },
		children: { control: false },
	},
};
export default meta;

type Story = StoryObj< typeof Snackbar >;

export const Uploading: Story = {
	args: {
		icon: UPLOAD_SPINNER,
		children: 'Uploading — sunset-over-the-bay.jpg',
		explicitDismiss: true,
	},
};

export const UploadingMultiple: Story = {
	args: {
		icon: UPLOAD_SPINNER,
		children: 'Uploading 1 of 3 — sunset-over-the-bay.jpg',
		explicitDismiss: true,
	},
};

export const Complete: Story = {
	args: {
		icon: UPLOAD_DONE,
		children: 'Upload complete',
	},
};

/**
 * All states shown together for quick comparison of the icon alignment and
 * sizing between the spinner and the completion checkmark.
 */
export const AllStates: Story = {
	render: () => (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'flex-start',
				gap: '12px',
			} }
		>
			<Snackbar icon={ UPLOAD_SPINNER } explicitDismiss>
				Uploading — sunset-over-the-bay.jpg
			</Snackbar>
			<Snackbar icon={ UPLOAD_SPINNER } explicitDismiss>
				Uploading 1 of 3 — sunset-over-the-bay.jpg
			</Snackbar>
			<Snackbar icon={ UPLOAD_DONE }>Upload complete</Snackbar>
		</div>
	),
};
