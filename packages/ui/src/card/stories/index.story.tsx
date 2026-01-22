import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { Badge } from '../../badge';
import { Button } from '../../button';
import { Card } from '../index';

const meta: Meta< typeof Card > = {
	title: 'Design System/Components/Card',
	component: Card,
};
export default meta;

type Story = StoryObj< typeof Card >;

const placeholderStyles: CSSProperties = {
	height: '240px',
	background: 'var(--wpds-color-bg-surface-neutral-weak)',
	borderRadius: 'var(--wpds-border-radius-surface-md)',
	display: 'grid',
	placeItems: 'center',
	textTransform: 'uppercase',
	color: 'var(--wpds-color-fg-content-neutral)',
	fontSize: 'var(--wpds-font-size-xs)',
	fontWeight: 'var(--wpds-font-weight-medium)',
	lineHeight: 'var(--wpds-font-line-height-xs)',
};

export const Default: Story = {
	render: ( args ) => (
		<Card { ...args }>
			<Card.Header>Card title</Card.Header>
			<Card.Body>
				<div style={ placeholderStyles }>Content</div>
			</Card.Body>
		</Card>
	),
};

export const WithHeaderActions: Story = {
	render: ( args ) => (
		<Card { ...args }>
			<Card.Header>
				<span>Card title</span>
				<span
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: 'var(--wpds-dimension-gap-xs)',
					} }
				>
					<Badge intent="low">Badge</Badge>
					<Button tone="neutral" variant="minimal" size="compact">
						Action
					</Button>
				</span>
			</Card.Header>
			<Card.Body>
				<div style={ placeholderStyles }>Content</div>
			</Card.Body>
		</Card>
	),
};
