import type { Meta, StoryObj } from '@storybook/react-vite';
import { createInterpolateElement } from '@wordpress/element';
import { Button } from '../index';
import { Link } from '../../link';
import { LinkButton } from '../../link-button';
import { Stack } from '../../stack';
import { Text } from '../../text';

const meta: Meta = {
	title: 'Design System/Components/Button/Usage Guidelines',
	parameters: {
		controls: { disable: true },
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and text overflow behavior. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
	tags: [ '!dev' ],
};
export default meta;

type Story = StoryObj;

/**
 * Use `Button` for actions on the current view: submitting a form, opening a
 * dialog, toggling UI, or running JavaScript. It renders a `<button>` and
 * supports loading and pressed states.
 */
export const UseButtonForActions: Story = {
	render: () => (
		<Stack direction="row" gap="sm" wrap="wrap">
			<Button type="submit">Save changes</Button>
			<Button variant="outline" onClick={ () => {} }>
				Open settings
			</Button>
		</Stack>
	),
};

/**
 * Use `Link` for navigation. Its underline and link styling communicate where
 * the user is going more clearly than a button-shaped control.
 */
export const UseLinkForInlineNavigation: Story = {
	render: () => (
		<Text variant="body-md" render={ <p /> }>
			{ createInterpolateElement(
				'Read the <DocumentationLink /> for more details, or <ExternalLink />.',
				{
					DocumentationLink: (
						<Link href="https://wordpress.org/documentation/">
							documentation
						</Link>
					),
					ExternalLink: (
						<Link href="https://example.com" openInNewTab>
							open an external reference
						</Link>
					),
				}
			) }
		</Text>
	),
};

/**
 * Prefer `Link` for navigation — its underline and link styling set clearer
 * expectations than a button-shaped control. Reach for `LinkButton` only when
 * you have considered `Button` and `Link` and still need button prominence.
 */
export const ConsiderLinkBeforeLinkButton: Story = {
	render: () => (
		<Stack direction="column" gap="lg">
			<Stack direction="column" gap="xs">
				<Text variant="heading-sm">Prefer `Link` for navigation</Text>
				<Text variant="body-md" render={ <p /> }>
					{ createInterpolateElement(
						'To learn more, see the <DocumentationLink />. A text link signals navigation and matches what users should expect.',
						{
							DocumentationLink: (
								<Link href="https://wordpress.org/documentation/">
									documentation
								</Link>
							),
						}
					) }
				</Text>
			</Stack>
			<Stack direction="column" gap="xs">
				<Text variant="heading-sm">
					Use `LinkButton` only when button prominence is intentional
				</Text>
				<Text variant="body-md" render={ <p /> }>
					If surrounding copy is not enough context, a standalone call
					to action may justify button styling — but ask first whether
					`Link` would communicate the destination more clearly.
				</Text>
				<div>
					<LinkButton href="https://example.com">
						Get started
					</LinkButton>
				</div>
			</Stack>
		</Stack>
	),
};
