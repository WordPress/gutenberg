import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
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
		await waitFor( () => {
			const focusableItems =
				canvasElement.querySelectorAll< HTMLElement >(
					'ol a, ol button, ol [aria-current="page"][tabindex="0"]'
				);
			expect( focusableItems.length ).toBeGreaterThan( 0 );

			for ( const item of focusableItems ) {
				item.focus();
				expect( item ).toHaveFocus();

				const itemRect = item.getBoundingClientRect();
				const list = item.closest( 'ol' );
				const styles = getComputedStyle( item );
				const ringSize =
					Number.parseFloat( styles.outlineWidth ) +
					Number.parseFloat( styles.outlineOffset );

				expect( list ).not.toBeNull();
				if ( ! list ) {
					continue;
				}
				const listRect = list.getBoundingClientRect();

				if ( item.tagName === 'BUTTON' ) {
					expect( itemRect.height ).toBe( 24 );
					expect( itemRect.width ).toBeGreaterThanOrEqual( 24 );
				}
				expect( listRect.height ).toBe( 32 );
				expect( ringSize ).toBeGreaterThan( 0 );
				expect( itemRect.top - ringSize ).toBeGreaterThanOrEqual(
					listRect.top
				);
				expect( itemRect.bottom + ringSize ).toBeLessThanOrEqual(
					listRect.bottom
				);
				expect( itemRect.left - ringSize ).toBeGreaterThanOrEqual(
					listRect.left
				);
				expect( itemRect.right + ringSize ).toBeLessThanOrEqual(
					listRect.right
				);
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
