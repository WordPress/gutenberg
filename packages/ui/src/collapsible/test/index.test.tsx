import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from '@wordpress/element';
import * as Collapsible from '../index';

function UncontrolledCollapsible( {
	defaultOpen,
	disabled,
}: {
	defaultOpen?: boolean;
	disabled?: boolean;
} ) {
	return (
		<Collapsible.Root defaultOpen={ defaultOpen } disabled={ disabled }>
			<Collapsible.Trigger>Toggle</Collapsible.Trigger>
			<Collapsible.Panel>Panel content</Collapsible.Panel>
		</Collapsible.Root>
	);
}

function ControlledCollapsible( {
	onOpenChange,
}: {
	onOpenChange?: ( open: boolean ) => void;
} ) {
	const [ open, setOpen ] = useState( false );
	return (
		<Collapsible.Root
			open={ open }
			onOpenChange={ ( nextOpen ) => {
				setOpen( nextOpen );
				onOpenChange?.( nextOpen );
			} }
		>
			<Collapsible.Trigger>Toggle</Collapsible.Trigger>
			<Collapsible.Panel>Controlled panel</Collapsible.Panel>
		</Collapsible.Root>
	);
}

describe( 'Collapsible', () => {
	describe( 'ref forwarding', () => {
		it( 'forwards ref on Root', () => {
			const ref = createRef< HTMLDivElement >();
			render(
				<Collapsible.Root ref={ ref }>
					<Collapsible.Trigger>Toggle</Collapsible.Trigger>
					<Collapsible.Panel>Content</Collapsible.Panel>
				</Collapsible.Root>
			);
			expect( ref.current ).toBeInstanceOf( HTMLDivElement );
		} );

		it( 'forwards ref on Trigger', () => {
			const ref = createRef< HTMLButtonElement >();
			render(
				<Collapsible.Root>
					<Collapsible.Trigger ref={ ref }>
						Toggle
					</Collapsible.Trigger>
					<Collapsible.Panel>Content</Collapsible.Panel>
				</Collapsible.Root>
			);
			expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
		} );

		it( 'forwards ref on Panel', () => {
			const ref = createRef< HTMLDivElement >();
			render(
				<Collapsible.Root defaultOpen>
					<Collapsible.Trigger>Toggle</Collapsible.Trigger>
					<Collapsible.Panel ref={ ref }>Content</Collapsible.Panel>
				</Collapsible.Root>
			);
			expect( ref.current ).toBeInstanceOf( HTMLDivElement );
		} );
	} );

	describe( 'uncontrolled', () => {
		it( 'is collapsed by default', () => {
			render( <UncontrolledCollapsible /> );
			expect(
				screen.queryByText( 'Panel content' )
			).not.toBeInTheDocument();
		} );

		it( 'shows panel when defaultOpen is true', () => {
			render( <UncontrolledCollapsible defaultOpen /> );
			expect( screen.getByText( 'Panel content' ) ).toBeVisible();
		} );

		it( 'toggles panel on trigger click', async () => {
			const user = userEvent.setup();
			render( <UncontrolledCollapsible /> );

			expect(
				screen.queryByText( 'Panel content' )
			).not.toBeInTheDocument();

			await user.click(
				screen.getByRole( 'button', { name: 'Toggle' } )
			);
			expect( screen.getByText( 'Panel content' ) ).toBeVisible();

			await user.click(
				screen.getByRole( 'button', { name: 'Toggle' } )
			);
			expect(
				screen.queryByText( 'Panel content' )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'controlled', () => {
		it( 'calls onOpenChange when toggled', async () => {
			const onOpenChange = jest.fn();
			const user = userEvent.setup();

			render( <ControlledCollapsible onOpenChange={ onOpenChange } /> );

			await user.click(
				screen.getByRole( 'button', { name: 'Toggle' } )
			);
			expect( onOpenChange ).toHaveBeenCalledWith( true );

			await user.click(
				screen.getByRole( 'button', { name: 'Toggle' } )
			);
			expect( onOpenChange ).toHaveBeenCalledWith( false );
		} );
	} );

	describe( 'disabled', () => {
		it( 'does not toggle when disabled', async () => {
			const user = userEvent.setup();
			render( <UncontrolledCollapsible defaultOpen disabled /> );

			expect( screen.getByText( 'Panel content' ) ).toBeVisible();

			await user.click(
				screen.getByRole( 'button', { name: 'Toggle' } )
			);
			expect( screen.getByText( 'Panel content' ) ).toBeVisible();
		} );
	} );

	describe( 'render prop', () => {
		it( 'supports render prop on Root', () => {
			const ref = createRef< HTMLDivElement >();
			render(
				<Collapsible.Root ref={ ref } render={ <section /> }>
					<Collapsible.Trigger>Toggle</Collapsible.Trigger>
					<Collapsible.Panel>Content</Collapsible.Panel>
				</Collapsible.Root>
			);
			expect( ref.current?.tagName ).toBe( 'SECTION' );
		} );

		it( 'supports render prop on Trigger', () => {
			render(
				<Collapsible.Root>
					<Collapsible.Trigger
						nativeButton={ false }
						render={ <div /> }
					>
						Toggle
					</Collapsible.Trigger>
					<Collapsible.Panel>Content</Collapsible.Panel>
				</Collapsible.Root>
			);
			const trigger = screen.getByRole( 'button', { name: 'Toggle' } );
			expect( trigger.tagName ).toBe( 'DIV' );
		} );

		it( 'supports render prop on Panel', () => {
			const ref = createRef< HTMLDivElement >();
			render(
				<Collapsible.Root defaultOpen>
					<Collapsible.Trigger>Toggle</Collapsible.Trigger>
					<Collapsible.Panel ref={ ref } render={ <section /> }>
						Content
					</Collapsible.Panel>
				</Collapsible.Root>
			);
			expect( ref.current?.tagName ).toBe( 'SECTION' );
		} );
	} );

	describe( 'custom className', () => {
		it( 'applies className to Root', () => {
			const ref = createRef< HTMLDivElement >();
			render(
				<Collapsible.Root ref={ ref } className="custom-root">
					<Collapsible.Trigger>Toggle</Collapsible.Trigger>
					<Collapsible.Panel>Content</Collapsible.Panel>
				</Collapsible.Root>
			);
			expect( ref.current ).toHaveClass( 'custom-root' );
		} );

		it( 'applies className to Trigger', () => {
			render(
				<Collapsible.Root>
					<Collapsible.Trigger className="custom-trigger">
						Toggle
					</Collapsible.Trigger>
					<Collapsible.Panel>Content</Collapsible.Panel>
				</Collapsible.Root>
			);
			expect(
				screen.getByRole( 'button', { name: 'Toggle' } )
			).toHaveClass( 'custom-trigger' );
		} );

		it( 'applies className to Panel', () => {
			const ref = createRef< HTMLDivElement >();
			render(
				<Collapsible.Root defaultOpen>
					<Collapsible.Trigger>Toggle</Collapsible.Trigger>
					<Collapsible.Panel ref={ ref } className="custom-panel">
						Content
					</Collapsible.Panel>
				</Collapsible.Root>
			);
			expect( ref.current ).toHaveClass( 'custom-panel' );
		} );
	} );
} );
