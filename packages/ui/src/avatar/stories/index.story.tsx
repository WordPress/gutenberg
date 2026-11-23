import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../index';
import { Button } from '../../button';
import { Stack } from '../../stack';
import { Text } from '../../text';
import * as Tooltip from '../../tooltip';

// A profile picture, drawn in code so the stories request no image.
const IMAGE_SRC = `data:image/svg+xml,${ encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter><filter id="s"><feGaussianBlur stdDeviation="1.6"/></filter><filter id="f"><feGaussianBlur stdDeviation=".5"/></filter><radialGradient id="k" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="#f3cfb3"/><stop offset=".6" stop-color="#dba585"/><stop offset="1" stop-color="#b47a5c"/></radialGradient><linearGradient id="h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b4632"/><stop offset="1" stop-color="#2f1c14"/></linearGradient><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d7f97"/><stop offset="1" stop-color="#34495c"/></linearGradient></defs><rect width="128" height="128" fill="#8aa39a"/><g filter="url(#b)"><circle cx="18" cy="24" r="22" fill="#c9d8c4"/><circle cx="110" cy="38" r="26" fill="#5f7d74"/><circle cx="100" cy="100" r="20" fill="#a9bfb2"/></g><path d="M4 128c3-24 22-34 42-38l18 8 18-8c20 4 39 14 42 38z" fill="url(#c)"/><path d="M50 72h28v22c-6 8-22 8-28 0z" fill="#c38b6c"/><path d="M50 78c8 8 20 8 28 0v6c-8 7-20 7-28 0z" fill="#8d5a42" opacity=".5" filter="url(#s)"/><ellipse cx="38" cy="58" rx="5" ry="9" fill="#cf9877"/><ellipse cx="90" cy="58" rx="5" ry="9" fill="#cf9877"/><path d="M38 52c0-20 12-32 26-32s26 12 26 32c0 22-12 36-26 36S38 74 38 52z" fill="url(#k)"/><g filter="url(#s)" opacity=".55"><ellipse cx="50" cy="66" rx="6" ry="4" fill="#e39a86"/><ellipse cx="78" cy="66" rx="6" ry="4" fill="#e39a86"/><path d="M64 54c-2 6-4 10-3 13 2 1 5 1 7 0" stroke="#9e664a" stroke-width="2.5" fill="none"/><ellipse cx="64" cy="84" rx="14" ry="4" fill="#a8705a"/></g><path d="M36 54c-4-24 10-38 29-38 18 0 31 12 27 36-3-10-8-16-15-19-10 5-26 6-36 2-3 4-4 10-5 19z" fill="url(#h)"/><path d="M50 26c8-4 22-4 30 2" stroke="#8a5f45" stroke-width="2" fill="none" opacity=".6" filter="url(#f)"/><g filter="url(#f)"><path d="M47 48q6-3 12-1M69 47q6-2 12 1" stroke="#3a2419" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="53" cy="56" rx="4" ry="2.3" fill="#f4eee9"/><ellipse cx="75" cy="56" rx="4" ry="2.3" fill="#f4eee9"/><circle cx="53" cy="56" r="2" fill="#4b3324"/><circle cx="75" cy="56" r="2" fill="#4b3324"/><circle cx="53.6" cy="55.4" r=".6" fill="#fff"/><circle cx="75.6" cy="55.4" r=".6" fill="#fff"/><path d="M49 53.5q4-2 8 0M71 53.5q4-2 8 0" stroke="#7a4e38" stroke-width="1" fill="none"/><path d="M56 73q8 4 16 0q-8 2-16 0z" fill="#a85f52" stroke="#9a5446" stroke-width="1.4" stroke-linejoin="round"/></g></svg>'
) }`;

// The WordPress logo, drawn in code so the stories request no image.
const WORDPRESS_LOGO_URL = `data:image/svg+xml,${ encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#1e1e1e" d="M 22 12 C 22 6.49 17.51 2 12 2 C 6.48 2 2 6.49 2 12 C 2 17.52 6.48 22 12 22 C 17.51 22 22 17.52 22 12 M 9.78 17.37 L 6.37 8.22 C 6.92 8.2 7.54 8.14 7.54 8.14 C 8.04 8.08 7.98 7.01 7.48 7.03 C 7.48 7.03 6.03 7.14 5.11 7.14 C 4.93 7.14 4.74 7.14 4.53 7.13 C 6.12 4.69 8.87 3.11 12 3.11 C 14.33 3.11 16.45 3.98 18.05 5.45 C 17.37 5.34 16.4 5.84 16.4 7.03 C 16.4 7.77 16.85 8.39 17.3 9.13 C 17.65 9.74 17.85 10.49 17.85 11.59 C 17.85 13.08 16.45 16.59 16.45 16.59 L 13.42 8.22 C 13.96 8.2 14.24 8.05 14.24 8.05 C 14.74 8 14.68 6.8 14.18 6.83 C 14.18 6.83 12.74 6.95 11.8 6.95 C 10.93 6.95 9.47 6.83 9.47 6.83 C 8.97 6.8 8.91 8.03 9.41 8.05 L 10.33 8.13 L 11.59 11.54 L 9.78 17.37 M 19.41 12 C 19.65 11.36 20.15 10.13 19.84 7.75 C 20.54 9.04 20.89 10.46 20.89 12 C 20.89 15.29 19.16 18.24 16.49 19.78 C 17.46 17.19 18.43 14.58 19.41 12 M 8.1 20.09 C 5.12 18.65 3.11 15.53 3.11 12 C 3.11 10.7 3.34 9.52 3.83 8.41 C 5.25 12.3 6.67 16.2 8.1 20.09 M 12.13 13.46 L 14.71 20.44 C 13.85 20.73 12.95 20.89 12 20.89 C 11.21 20.89 10.43 20.78 9.71 20.56 C 10.52 18.18 11.33 15.82 12.13 13.46 L 12.13 13.46"/></svg>'
) }`;

const meta: Meta< typeof Avatar > = {
	title: 'Components/@wordpress-ui/Avatar',
	id: 'design-system-components-avatar',
	component: Avatar,
	args: { name: 'Alex Morgan' },
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'API and design may change.',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Avatar >;

export const Default: Story = {
	args: { src: IMAGE_SRC },
};

/** The assigned color sets the activity ring; the initials fill adapts to contrast with it. */
export const WithColor: Story = {
	args: { color: '#008a20' },
	render: ( args ) => (
		<Stack gap="md" align="center">
			<Avatar { ...args } src={ IMAGE_SRC } active />
			<Avatar { ...args } active />
			<Avatar { ...args } />
		</Stack>
	),
};

/** Activity changes the ring without changing the avatar's footprint. */
export const Activity: Story = {
	render: ( args ) => (
		<Stack gap="md" align="center">
			<Avatar { ...args } active={ false } />
			<Avatar { ...args } active />
			<Avatar { ...args } src={ IMAGE_SRC } active={ false } />
			<Avatar { ...args } src={ IMAGE_SRC } active />
		</Stack>
	),
};

/** Single-word names display one larger initial. Hyphens and apostrophes stay within words. */
export const Initials: Story = {
	render: ( args ) => (
		<Stack gap="md" align="center">
			{ [
				'Alex Morgan',
				'Alex',
				'Jean-Luc',
				"O'Connor",
				'👩🏽‍💻',
				'李 小龙',
			].map( ( name ) => (
				<Avatar { ...args } key={ name } name={ name } />
			) ) }
		</Stack>
	),
};

/** Size describes the intended image size on high-DPI screens, with ring space reserved outside it. */
export const Sizes: Story = {
	render: ( args ) => (
		<Stack gap="md" align="center">
			{ ( [ 'xs', 'sm', 'md', 'lg', 'xl' ] as const ).map( ( size ) => (
				<Avatar { ...args } key={ size } size={ size } />
			) ) }
		</Stack>
	),
};

/** Use a circle for a person's portrait and a square to preserve the corners of a site logo. */
export const Shapes: Story = {
	render: ( args ) => (
		<Stack gap="md" align="center">
			<Avatar { ...args } src={ IMAGE_SRC } shape="circle" />
			<Avatar
				{ ...args }
				name="WordPress"
				src={ WORDPRESS_LOGO_URL }
				shape="square"
			/>
		</Stack>
	),
};

/** Render the Avatar as the button so the focus ring follows its shape. */
export const Interactive: Story = {
	args: { color: '#008a20', active: true },
	render: ( args ) => (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<Avatar
						{ ...args }
						render={ <Button variant="unstyled" /> }
					/>
				}
			/>
			<Tooltip.Popup>{ args.name }</Tooltip.Popup>
		</Tooltip.Root>
	),
};

/** Hide the avatar from assistive technology when nearby text identifies the person. */
export const WithVisibleName: Story = {
	render: ( args ) => (
		<Stack gap="sm" align="center">
			<Avatar { ...args } aria-hidden="true" />
			<Text>{ args.name }</Text>
		</Stack>
	),
};
