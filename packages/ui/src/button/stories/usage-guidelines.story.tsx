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
						<Link href="https://make.wordpress.org/" openInNewTab>
							open an external reference
						</Link>
					),
				}
			) }
		</Text>
	),
};

/**
 * Use `LinkButton` when navigation should look like a `Button`, such as
 * standalone calls to action that require an `href`.
 *
 * Note: Prefer `Link` for navigation when possible. Its underline and link
 * styling set clearer expectations than a button-shaped control.
 */
export const UseLinkButtonForNavigation: Story = {
	render: () => (
		<Stack direction="column" gap="md">
			<Text variant="body-md" render={ <p /> }>
				Standalone navigation calls to action can use `LinkButton` when
				button styling matches the surrounding UI.
			</Text>
			<div>
				<LinkButton href="https://make.wordpress.org/">
					Get started
				</LinkButton>
			</div>
			<Text variant="body-md" render={ <p /> }>
				{ createInterpolateElement(
					'Note: Prefer <LinkComponent /> for navigation when possible — its underline and link styling communicate where the user is going more clearly than a button-shaped control.',
					{
						LinkComponent: (
							<Link href="https://wordpress.org/documentation/">
								Link
							</Link>
						),
					}
				) }
			</Text>
		</Stack>
	),
};
