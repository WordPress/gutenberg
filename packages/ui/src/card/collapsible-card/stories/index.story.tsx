import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { useState } from '@wordpress/element';
import { CollapsibleCard } from '../index';

const meta: Meta< typeof CollapsibleCard > = {
	title: 'Design System/Components/CollapsibleCard',
	component: CollapsibleCard,
	argTypes: {
		onOpenChange: { action: 'onOpenChange' },
		open: { control: false },
	},
};
export default meta;

type Story = StoryObj< typeof CollapsibleCard >;

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
	render: ( args ) => {
		const { onOpenChange, ...restArgs } = args;
		const [ open, setOpen ] = useState( false );
		const handleOpenChange = ( nextOpen: boolean ) => {
			setOpen( nextOpen );
		};

		return (
			<CollapsibleCard
				{ ...restArgs }
				open={ open }
				onOpenChange={ handleOpenChange }
			/>
		);
	},
	args: {
		title: 'Card title',
		summary: 'Card summary area',
		children: <div style={ placeholderStyles }>Content</div>,
	},
};
