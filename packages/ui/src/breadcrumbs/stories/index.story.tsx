import type { Meta, StoryObj } from '@storybook/react-vite';
import { forwardRef } from '@wordpress/element';
import type { ComponentProps } from 'react';
import * as Breadcrumbs from '../';

const meta: Meta< typeof Breadcrumbs.Root > = {
	title: 'Design System/Components/Breadcrumbs',
	component: Breadcrumbs.Root,
	subcomponents: {
		'Breadcrumbs.LinkItem': Breadcrumbs.LinkItem,
		'Breadcrumbs.CurrentItem': Breadcrumbs.CurrentItem,
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

type Story = StoryObj< typeof Breadcrumbs.Root >;

function ExampleTrail( { ariaLabel = 'Breadcrumbs' }: { ariaLabel?: string } ) {
	return (
		<Breadcrumbs.Root aria-label={ ariaLabel }>
			<Breadcrumbs.LinkItem href="/">Dashboard</Breadcrumbs.LinkItem>
			<Breadcrumbs.LinkItem href="/products">
				Products
			</Breadcrumbs.LinkItem>
			<Breadcrumbs.LinkItem href="/products/themes">
				Themes
			</Breadcrumbs.LinkItem>
			<Breadcrumbs.LinkItem href="/products/themes/twentytwentyfive">
				Twenty Twenty-Five
			</Breadcrumbs.LinkItem>
			<Breadcrumbs.CurrentItem>Style variations</Breadcrumbs.CurrentItem>
		</Breadcrumbs.Root>
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
};

export const LongLabelsAndRtl: Story = {
	render: () => (
		<div dir="rtl" style={ { inlineSize: 420, maxInlineSize: '100%' } }>
			<Breadcrumbs.Root aria-label="مسار التنقل">
				<Breadcrumbs.LinkItem href="/">
					لوحة التحكم
				</Breadcrumbs.LinkItem>
				<Breadcrumbs.LinkItem href="/appearance">
					المظهر وإعدادات التخصيص
				</Breadcrumbs.LinkItem>
				<Breadcrumbs.LinkItem href="/appearance/themes">
					القوالب المثبتة على هذا الموقع
				</Breadcrumbs.LinkItem>
				<Breadcrumbs.CurrentItem>
					إعدادات القالب الحالي وتخصيص أنماط العرض
				</Breadcrumbs.CurrentItem>
			</Breadcrumbs.Root>
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
		<Breadcrumbs.Root>
			<Breadcrumbs.LinkItem href="/" render={ <RouterLink /> }>
				Dashboard
			</Breadcrumbs.LinkItem>
			<Breadcrumbs.LinkItem
				href="/settings?section=writing#defaults"
				render={ <RouterLink /> }
			>
				Writing settings
			</Breadcrumbs.LinkItem>
			<Breadcrumbs.CurrentItem>Defaults</Breadcrumbs.CurrentItem>
		</Breadcrumbs.Root>
	),
};
