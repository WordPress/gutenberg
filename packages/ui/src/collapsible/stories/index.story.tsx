import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import type { CSSProperties } from 'react';
import { Button } from '../../button';
import { Collapsible } from '../index';

const meta: Meta< typeof Collapsible > = {
	title: 'Design System/Components/Collapsible',
	component: Collapsible,
	argTypes: {
		defaultOpen: { control: false },
		onOpenChange: { action: 'onOpenChange' },
		open: { control: false },
	},
};
export default meta;

type Story = StoryObj< typeof Collapsible >;

const placeholderStyles: CSSProperties = {
	height: '200px',
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
		const [ open, setOpen ] = useState( args.defaultOpen ?? false );
		const handleOpenChange = ( nextOpen: boolean ) => {
			setOpen( nextOpen );
		};

		return (
			<Collapsible
				{ ...restArgs }
				open={ open }
				onOpenChange={ handleOpenChange }
			>
				<div
					style={ {
						display: 'flex',
						flexDirection: 'column',
						gap: '12px',
					} }
				>
					<Collapsible.Trigger>
						<Button>
							{ open ? 'Hide details' : 'Show details' }
						</Button>
					</Collapsible.Trigger>
					<Collapsible.Content keepMounted>
						<div style={ placeholderStyles }>Details</div>
					</Collapsible.Content>
				</div>
			</Collapsible>
		);
	},
};
