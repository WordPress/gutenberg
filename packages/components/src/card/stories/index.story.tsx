/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies
 */
import {
	Card,
	CardHeader,
	CardBody,
	CardDivider,
	CardMedia,
	CardFooter,
} from '..';
import { Text } from '../../text';
import { Heading } from '../../heading';
import Button from '../../button';

const meta: Meta< typeof Card > = {
	component: Card,
	// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
	subcomponents: { CardHeader, CardBody, CardDivider, CardMedia, CardFooter },
	title: 'Components/Containers/Card',
	id: 'components-card',
	argTypes: {
		as: {
			control: false,
		},
		children: {
			control: false,
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};

export default meta;

export const Default: StoryObj< typeof Card > = {
	args: {
		children: (
			<>
				<CardHeader>
					<Heading>CardHeader</Heading>
				</CardHeader>
				<CardBody>
					<Text>CardBody</Text>
				</CardBody>
				<CardBody>
					<Text>CardBody (before CardDivider)</Text>
				</CardBody>
				<CardDivider />
				<CardBody>
					<Text>CardBody (after CardDivider)</Text>
				</CardBody>
				<CardMedia>
					<img
						alt="Card Media"
						src="https://images.unsplash.com/photo-1566125882500-87e10f726cdc?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1867&q=80"
					/>
				</CardMedia>
				<CardFooter>
					<Text>CardFooter</Text>
					<Button variant="secondary">Action Button</Button>
				</CardFooter>
			</>
		),
	},
};

/**
 * `CardMedia` provides a container for full-bleed content within a `Card`,
 * such as images, video, or even just a background color. The corners will be rounded if necessary.
 */
export const FullBleedContent: StoryObj< typeof Card > = {
	...Default,
	args: {
		...Default.args,
		children: (
			<CardMedia>
				<div style={ { padding: 16, background: 'beige' } }>
					Some full bleed content
				</div>
			</CardMedia>
		),
	},
};

/**
 * The Card component supports three approaches to padding:
 * 1. Default padding (medium) - no size prop needed
 * 2. Token-based padding - using size tokens: xSmall (8px), small (16px), medium (24px), large (32px)
 * 3. Directional padding - customize each side independently
 *
 * Each component (Card, CardHeader, CardBody) can have its own padding configuration.
 */
export const PaddingVariations: StoryObj< typeof Card > = {
	render: () => (
		<div
			style={ { display: 'flex', flexDirection: 'column', gap: '32px' } }
		>
			{ /* 1. Default Padding */ }
			<div>
				<Card>
					<CardHeader>
						<Text>Header with default padding</Text>
					</CardHeader>
					<CardBody>
						<Text>Body with default padding (medium)</Text>
					</CardBody>
				</Card>
			</div>

			<div>
				<Card
					size={ {
						// 32px top, 24px sides, 16px bottom
						top: 'large',
						right: 'medium',
						bottom: 'small',
						left: 'medium',
					} }
				>
					<CardHeader
						size={ {
							// 16px top/bottom, 32px sides
							top: 'small',
							right: 'large',
							bottom: 'small',
							left: 'large',
						} }
					>
						<Text>
							Header with custom padding per side (small top,
							large sides, small bottom)
						</Text>
					</CardHeader>
					<CardBody
						size={ {
							// 24px vertical, 8px horizontal
							top: 'medium',
							right: 'xSmall',
							bottom: 'medium',
							left: 'large',
						} }
					>
						<Text>
							Body with custom padding per side (medium top,
							xSmall right, medium bottom, large left)
						</Text>
					</CardBody>
				</Card>
			</div>
		</div>
	),
};
