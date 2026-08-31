import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { forwardRef } from '@wordpress/element';
import type { ComponentProps } from 'react';
import * as Breadcrumb from '../';

const meta: Meta< typeof Breadcrumb.Root > = {
	title: 'Design System/Components/Breadcrumb',
	component: Breadcrumb.Root,
	subcomponents: {
		'Breadcrumb.LinkItem': Breadcrumb.LinkItem,
		'Breadcrumb.CurrentItem': Breadcrumb.CurrentItem,
	},
	argTypes: {
		children: { control: false },
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Responsive overflow uses the new Menu component, which is also currently marked use-with-caution.',
		},
	},
};

export default meta;

type Story = StoryObj< typeof Breadcrumb.Root >;

function ExampleTrail( { ariaLabel = 'Breadcrumbs' }: { ariaLabel?: string } ) {
	return (
		<Breadcrumb.Root aria-label={ ariaLabel }>
			<Breadcrumb.LinkItem href="/">Dashboard</Breadcrumb.LinkItem>
			<Breadcrumb.LinkItem href="/products">Products</Breadcrumb.LinkItem>
			<Breadcrumb.LinkItem href="/products/themes">
				Themes
			</Breadcrumb.LinkItem>
			<Breadcrumb.LinkItem href="/products/themes/twentytwentyfive">
				Twenty Twenty-Five
			</Breadcrumb.LinkItem>
			<Breadcrumb.CurrentItem>Style variations</Breadcrumb.CurrentItem>
		</Breadcrumb.Root>
	);
}

export const Default: Story = {
	render: () => <ExampleTrail />,
};

/**
 * Each example contains the same complete trail. The component measures its
 * available inline size and progressively moves ancestors into the overflow
 * menu. Resize the canvas to see it respond continuously.
 */
export const ResponsiveStates: Story = {
	render: () => (
		<div
			style={ {
				display: 'grid',
				gap: 'var(--wpds-dimension-gap-lg)',
			} }
		>
			{ [ 760, 420, 260, 120 ].map( ( width ) => (
				<div
					key={ width }
					style={ { inlineSize: width, maxInlineSize: '100%' } }
				>
					<ExampleTrail
						ariaLabel={ `Breadcrumbs at ${ width } pixels` }
					/>
				</div>
			) ) }
		</div>
	),
	play: async ( { canvasElement } ) => {
		const canvas = within( canvasElement );
		await waitFor( () => {
			const triggers = canvas.getAllByRole( 'button', {
				name: /hidden breadcrumb/,
			} );
			for ( const trigger of triggers ) {
				const { width, height } = trigger.getBoundingClientRect();
				expect( width ).toBe( 44 );
				expect( height ).toBe( 44 );
			}
		} );
	},
};

export const LongLabelsAndRtl: Story = {
	render: () => (
		<div dir="rtl" style={ { inlineSize: 420, maxInlineSize: '100%' } }>
			<Breadcrumb.Root aria-label="مسار التنقل">
				<Breadcrumb.LinkItem href="/">لوحة التحكم</Breadcrumb.LinkItem>
				<Breadcrumb.LinkItem href="/appearance">
					المظهر وإعدادات التخصيص
				</Breadcrumb.LinkItem>
				<Breadcrumb.LinkItem href="/appearance/themes">
					القوالب المثبتة على هذا الموقع
				</Breadcrumb.LinkItem>
				<Breadcrumb.CurrentItem>
					إعدادات القالب الحالي وتخصيص أنماط العرض
				</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		</div>
	),
};

const RouterLink = forwardRef< HTMLAnchorElement, ComponentProps< 'a' > >(
	function RouterLink( { children, ...props }, ref ) {
		return (
			<a { ...props } ref={ ref } data-router-link>
				{ children }
			</a>
		);
	}
);

export const RouterLinkComposition: Story = {
	render: () => (
		<Breadcrumb.Root>
			<Breadcrumb.LinkItem href="/" render={ <RouterLink /> }>
				Dashboard
			</Breadcrumb.LinkItem>
			<Breadcrumb.LinkItem
				href="/settings?section=writing#defaults"
				render={ <RouterLink /> }
			>
				Writing settings
			</Breadcrumb.LinkItem>
			<Breadcrumb.CurrentItem>Defaults</Breadcrumb.CurrentItem>
		</Breadcrumb.Root>
	),
};
