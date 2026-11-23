import type { Meta, StoryObj } from '@storybook/react-vite';
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

// A landscape drawn in code, so the story requests no image.
const MEDIA_URL = `data:image/svg+xml,${ encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600"><rect width="1200" height="600" fill="#bfe0f5"/><circle cx="900" cy="170" r="80" fill="#f6c343"/><path d="M0 460 300 220 560 420 800 280 1200 500V600H0z" fill="#5a7d5a"/></svg>'
) }`;

const meta: Meta< typeof Card > = {
	component: Card,
	subcomponents: { CardHeader, CardBody, CardDivider, CardMedia, CardFooter },
	title: 'Components/@wordpress-components/Containers/Card',
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
		componentStatus: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Use [`Card`](?path=/docs/design-system-components-card--docs) or [`CollapsibleCard`](?path=/docs/design-system-components-collapsiblecard--docs) from `@wordpress/ui` instead.',
		},
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
					<img alt="Card Media" src={ MEDIA_URL } />
				</CardMedia>
				<CardFooter>
					<Text>CardFooter</Text>
					<Button __next40pxDefaultSize variant="secondary">
						Action Button
					</Button>
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
 * 2. Token-based padding - using size tokens: xSmall, small, medium, large
 * 3. Logical padding - customize each direction using logical properties
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
				<Card>
					<CardHeader
						size={ {
							blockStart: 'large',
							blockEnd: 'small',
							inlineStart: 'xSmall',
							inlineEnd: 'large',
						} }
					>
						<Text>
							Header with logical padding (large blockStart, small
							blockEnd, xSmall inlineStart, large inlineEnd)
						</Text>
					</CardHeader>
					<CardBody
						size={ {
							blockStart: 'medium',
							blockEnd: 'xSmall',
							inlineStart: 'large',
							inlineEnd: 'xSmall',
						} }
					>
						<Text>
							Body with logical padding (medium blockStart, xSmall
							blockEnd, large inlineStart, xSmall inlineEnd)
						</Text>
					</CardBody>
				</Card>
			</div>
		</div>
	),
};
