import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { forwardRef, useRef, useState } from '@wordpress/element';
import type { ComponentProps } from 'react';
import * as Breadcrumb from '../';

const meta: Meta< typeof Breadcrumb.Root > = {
	title: 'Components/@wordpress-ui/Breadcrumb',
	id: 'design-system-components-breadcrumb',
	component: Breadcrumb.Root,
	subcomponents: {
		'Breadcrumb.LinkItem': Breadcrumb.LinkItem,
		'Breadcrumb.ButtonItem': Breadcrumb.ButtonItem,
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
	function UnforwardedRouterLink( { children, ...props }, ref ) {
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

/**
 * Button ancestors select a position within one hierarchy. The consumer owns
 * selection and intentional focus moves. Keep variant="selection" when the
 * trail can become current-only, including its initial server render.
 */
export const HierarchySelection: Story = {
	render: function SelectionExample() {
		const [ selectedIndex, setSelectedIndex ] = useState( 3 );
		const [ width, setWidth ] = useState( 420 );
		const [ focusEditor, setFocusEditor ] = useState( false );
		const editorRef = useRef< HTMLTextAreaElement >( null );
		const labels = [
			'Document',
			'Outer group',
			'Inner group',
			'Paragraph',
		];
		return (
			<div
				style={ {
					display: 'grid',
					gap: 'var(--wpds-dimension-gap-md)',
				} }
			>
				<label htmlFor="breadcrumb-width">
					Trail width
					<input
						id="breadcrumb-width"
						type="range"
						min={ 80 }
						max={ 600 }
						value={ width }
						onChange={ ( event ) =>
							setWidth( Number( event.target.value ) )
						}
					/>
				</label>
				<label htmlFor="breadcrumb-focus-editor">
					<input
						id="breadcrumb-focus-editor"
						type="checkbox"
						checked={ focusEditor }
						onChange={ ( event ) =>
							setFocusEditor( event.target.checked )
						}
					/>
					Focus the editor on selection
				</label>
				<Breadcrumb.Root
					aria-label="Block hierarchy"
					variant="selection"
					style={ { width, maxWidth: '100%' } }
				>
					{ labels
						.slice( 0, selectedIndex )
						.map( ( label, index ) => (
							<Breadcrumb.ButtonItem
								key={ label }
								onClick={ () => {
									setSelectedIndex( index );
									if ( focusEditor ) {
										editorRef.current?.focus();
									}
								} }
							>
								{ label }
							</Breadcrumb.ButtonItem>
						) ) }
					<Breadcrumb.CurrentItem key={ labels[ selectedIndex ] }>
						{ labels[ selectedIndex ] }
					</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
				<label htmlFor="breadcrumb-editor">
					Editor
					<textarea
						id="breadcrumb-editor"
						ref={ editorRef }
						defaultValue="Select an ancestor, or clear selection by choosing Document."
					/>
				</label>
				<button onClick={ () => setSelectedIndex( 3 ) }>
					Select Paragraph
				</button>
			</div>
		);
	},
};

export const CurrentOnly: Story = {
	render: () => (
		<>
			<Breadcrumb.Root aria-label="Page hierarchy">
				<Breadcrumb.CurrentItem>Dashboard</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
			<Breadcrumb.Root aria-label="Block hierarchy" variant="selection">
				<Breadcrumb.CurrentItem>Document</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		</>
	),
};
