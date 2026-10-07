import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { createRef, forwardRef, useRef, useState } from '@wordpress/element';
import type {
	ComponentProps,
	HTMLAttributes,
	MouseEvent,
	MouseEventHandler,
	Ref,
} from 'react';
import * as Breadcrumb from '../index';
import type { ButtonItemElement } from '../types';

const LABELS = [ 'Document', 'Outer group', 'Inner group', 'Paragraph' ];

const ComposedAncestor = forwardRef<
	ButtonItemElement,
	HTMLAttributes< ButtonItemElement >
>( function UnforwardedComposedAncestor( { role, ...props }, ref ) {
	return role === 'menuitem' ? (
		<div { ...props } role={ role } ref={ ref as Ref< HTMLDivElement > } />
	) : (
		<button { ...props } ref={ ref as Ref< HTMLButtonElement > } />
	);
} );

function SelectionTrail( {
	width = 500,
	keepSelection = false,
	focusEditor = false,
	renderFocusEditor = false,
	onActivate,
	ancestorRef,
}: {
	width?: number;
	keepSelection?: boolean;
	focusEditor?: boolean;
	renderFocusEditor?: boolean;
	onActivate?: MouseEventHandler< ButtonItemElement >;
	ancestorRef?: Ref< ButtonItemElement >;
} ) {
	const [ depth, setDepth ] = useState( 3 );
	const editorRef = useRef< HTMLTextAreaElement >( null );
	return (
		<>
			<Breadcrumb.Root
				aria-label="Block hierarchy"
				variant="selection"
				style={ { width } }
			>
				{ LABELS.slice( 0, depth ).map( ( label, index ) => (
					<Breadcrumb.ButtonItem
						key={ label }
						render={
							renderFocusEditor ? (
								<ComposedAncestor
									onClick={ () => editorRef.current?.focus() }
								/>
							) : undefined
						}
						ref={ index === 1 ? ancestorRef : undefined }
						style={ { width: 80 } }
						onClick={ ( event ) => {
							onActivate?.( event );
							if ( ! keepSelection ) {
								setDepth( index );
							}
							if ( focusEditor ) {
								editorRef.current?.focus();
							}
						} }
					>
						{ label }
					</Breadcrumb.ButtonItem>
				) ) }
				<Breadcrumb.CurrentItem
					key={ LABELS[ depth ] }
					style={ { width: 80 } }
				>
					{ LABELS[ depth ] }
				</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
			<textarea aria-label="Editor" ref={ editorRef } />
		</>
	);
}

describe( 'Breadcrumb hierarchy selection', () => {
	it.each( [ '{Enter}', ' ' ] )(
		'activates visible ancestors once with %s using native button semantics',
		async ( key ) => {
			const onActivate =
				vi.fn< MouseEventHandler< ButtonItemElement > >();
			await render(
				<SelectionTrail onActivate={ onActivate } keepSelection />
			);
			await userEvent.tab();
			const button = page.getByRole( 'button', { name: 'Document' } );
			await expect.element( button ).toHaveFocus();
			await expect.element( button ).toHaveAttribute( 'type', 'button' );
			expect( button.element() ).toBeInstanceOf( HTMLButtonElement );
			await userEvent.keyboard( key );
			expect( onActivate ).toHaveBeenCalledTimes( 1 );
			await expect.element( button ).toHaveFocus();
		}
	);

	it( 'preserves the action and ref contract between menu and visible representations', async () => {
		type ButtonProps = ComponentProps< typeof Breadcrumb.ButtonItem >;
		expectTypeOf< ButtonProps[ 'onClick' ] >().toEqualTypeOf<
			| ( (
					event: MouseEvent< HTMLButtonElement | HTMLDivElement >
			  ) => void )
			| undefined
		>();
		expectTypeOf< ButtonProps[ 'ref' ] >().toEqualTypeOf<
			Ref< HTMLButtonElement | HTMLDivElement > | undefined
		>();
		expectTypeOf< ButtonProps[ 'children' ] >().toEqualTypeOf< string >();
		expectTypeOf< 'href' | 'target' | 'openInNewTab' >().not.toExtend<
			keyof ButtonProps
		>();
		const ref = createRef< ButtonItemElement >();
		const targets: ButtonItemElement[] = [];
		const onActivate = vi.fn< MouseEventHandler< ButtonItemElement > >(
			( event ) => {
				targets.push( event.currentTarget );
			}
		);
		const view = await render(
			<SelectionTrail
				width={ 280 }
				keepSelection
				onActivate={ onActivate }
				ancestorRef={ ref }
			/>
		);
		const trigger = page.getByRole( 'button', {
			name: /hidden breadcrumb/,
		} );
		await expect.element( trigger ).toBeVisible();
		await trigger.click();
		const item = page.getByRole( 'menuitem', { name: 'Outer group' } );
		await expect.element( item ).toBeVisible();
		expect( ref.current ).toBe( item.element() );
		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
		await item.click();
		expect( onActivate ).toHaveBeenCalledTimes( 1 );
		expect( targets[ 0 ] ).toBeInstanceOf( HTMLDivElement );
		await expect
			.element( page.getByRole( 'menu' ) )
			.not.toBeInTheDocument();
		await page.getByRole( 'textbox', { name: 'Editor' } ).click();
		await view.rerender(
			<SelectionTrail
				width={ 500 }
				keepSelection
				onActivate={ onActivate }
				ancestorRef={ ref }
			/>
		);
		const button = page.getByRole( 'button', { name: 'Outer group' } );
		await expect.element( button ).toBeVisible();
		expect( ref.current ).toBe( button.element() );
		await button.click();
		expect( onActivate ).toHaveBeenCalledTimes( 2 );
		expect( targets[ 1 ] ).toBeInstanceOf( HTMLButtonElement );
	} );

	it.each( [ false, true ] )(
		'keeps deliberate focus after clearing selection, consumer focus move: %s',
		async ( focusEditor ) => {
			await render( <SelectionTrail focusEditor={ focusEditor } /> );
			await userEvent.tab();
			await userEvent.keyboard( '{Enter}' );
			const group = page.getByRole( 'group', {
				name: 'Block hierarchy',
			} );
			await expect.element( group ).toBeVisible();
			await expect
				.element( page.getByRole( 'navigation' ) )
				.not.toBeInTheDocument();
			const current = screen.getByText( 'Document', {
				selector: '[aria-current="true"]',
			} );
			const focusTarget = focusEditor
				? screen.getByRole( 'textbox', { name: 'Editor' } )
				: current;
			await expect.element( focusTarget ).toHaveFocus();
		}
	);

	it.each( [
		{ focusEditor: false, pointer: false },
		{ focusEditor: true, pointer: false },
		{ focusEditor: false, pointer: true },
		{ focusEditor: true, pointer: true },
	] )(
		'dismisses an overflow action and handles removal of its trigger, $focusEditor consumer focus move, $pointer pointer activation',
		async ( { focusEditor, pointer } ) => {
			await render(
				<SelectionTrail width={ 280 } focusEditor={ focusEditor } />
			);
			const trigger = page.getByRole( 'button', {
				name: /hidden breadcrumb/,
			} );
			await expect.element( trigger ).toBeVisible();
			await userEvent.tab();
			await userEvent.tab();
			await expect.element( trigger ).toHaveFocus();
			await userEvent.keyboard( '{Enter}' );
			await expect
				.element(
					page.getByRole( 'menuitem', { name: 'Outer group' } )
				)
				.toHaveFocus();
			if ( pointer ) {
				await page
					.getByRole( 'menuitem', { name: 'Outer group' } )
					.click();
			} else {
				await userEvent.keyboard( '{Enter}' );
			}
			await expect
				.element( page.getByRole( 'menu' ) )
				.not.toBeInTheDocument();
			await expect
				.element(
					page.getByRole( 'button', { name: /hidden breadcrumb/ } )
				)
				.not.toBeInTheDocument();
			const focusTarget = focusEditor
				? screen.getByRole( 'textbox', { name: 'Editor' } )
				: screen.getByText( 'Outer group', {
						selector: '[aria-current="true"]',
					} );
			await expect.element( focusTarget ).toHaveFocus();
		}
	);

	it( 'respects an editor focus move when an overflow action keeps the trail', async () => {
		await render(
			<SelectionTrail width={ 280 } focusEditor keepSelection />
		);
		const trigger = page.getByRole( 'button', {
			name: /hidden breadcrumb/,
		} );
		await expect.element( trigger ).toBeVisible();
		await trigger.click();
		await page.getByRole( 'menuitem', { name: 'Outer group' } ).click();
		await expect
			.element( page.getByRole( 'menu' ) )
			.not.toBeInTheDocument();
		await expect
			.element( page.getByRole( 'textbox', { name: 'Editor' } ) )
			.toHaveFocus();
	} );

	it( 'respects a focus move supplied through render composition', async () => {
		await render( <SelectionTrail width={ 280 } renderFocusEditor /> );
		const trigger = page.getByRole( 'button', {
			name: /hidden breadcrumb/,
		} );
		await expect.element( trigger ).toBeVisible();
		await trigger.click();
		await page.getByRole( 'menuitem', { name: 'Outer group' } ).click();
		await expect
			.element( page.getByRole( 'menu' ) )
			.not.toBeInTheDocument();
		await expect
			.element( page.getByRole( 'textbox', { name: 'Editor' } ) )
			.toHaveFocus();
	} );

	it( 'preserves group semantics when resize collapses every ancestor and transfers focus to overflow', async () => {
		const view = await render( <SelectionTrail keepSelection /> );
		await userEvent.tab();
		await view.rerender( <SelectionTrail width={ 80 } keepSelection /> );
		const trigger = page.getByRole( 'button', {
			name: 'Show 3 hidden breadcrumb items',
		} );
		await expect.element( trigger ).toHaveFocus();
		await expect
			.element( page.getByRole( 'group', { name: 'Block hierarchy' } ) )
			.toBeVisible();
		await expect
			.element( page.getByRole( 'navigation' ) )
			.not.toBeInTheDocument();
		expect(
			screen.getByText( 'Paragraph', {
				selector: '[aria-current="true"]',
			} )
		).toHaveAttribute( 'tabindex', '0' );
		await userEvent.keyboard( '{Enter}' );
		await expect
			.element( page.getByRole( 'menuitem', { name: 'Document' } ) )
			.toHaveFocus();
		await userEvent.keyboard( '{Escape}' );
		await expect.element( trigger ).toHaveFocus();
	} );

	it( 'shows a clipped button label tooltip on keyboard focus', async () => {
		await render(
			<Breadcrumb.Root aria-label="Block hierarchy">
				<Breadcrumb.ButtonItem style={ { maxWidth: 80 } }>
					A long ancestor label
				</Breadcrumb.ButtonItem>
				<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		);
		const button = page.getByRole( 'button', {
			name: 'A long ancestor label',
		} );
		await userEvent.tab();
		await expect.element( button ).toHaveFocus();
		await waitFor( () =>
			expect(
				screen.getByText( 'A long ancestor label', {
					selector: '[data-open]',
				} )
			).toBeVisible()
		);
	} );
} );
