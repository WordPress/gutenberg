import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	act,
	render,
	renderHook,
	screen,
	waitFor,
} from '@testing-library/react';
import { forwardRef, memo } from '@wordpress/element';
import { withFilters } from '@wordpress/components';
import { addFilter, removeFilter } from '@wordpress/hooks';
import DataForm from '../index';
import { isUiOverlayContentCompatible } from '../../utils/ui-overlay-compatibility';
import { useUiOverlaySupport } from '../use-ui-overlay-support';
import type { DataFormControlProps, Field } from '../../types';

type Item = { name: string };
const builtin: Field< Item > = { id: 'name', type: 'text' };

describe( 'DataForm overlay compatibility', () => {
	afterEach( () => vi.unstubAllGlobals() );

	it( 'allows built-in and configured controls in a UI host', () => {
		expect( DataForm.canUseUiOverlays( [ builtin ] ) ).toBe( true );
		expect(
			DataForm.canUseUiOverlays( [
				{ ...builtin, Edit: { control: 'textarea', rows: 3 } },
			] )
		).toBe( true );
	} );

	it( 'retains a legacy host when WordPress supplies older Components', () => {
		vi.stubGlobal( 'wp', { components: { Modal: {}, Popover: {} } } );
		expect( DataForm.canUseUiOverlays( [ builtin ] ) ).toBe( false );
	} );

	it( 'checks custom prefix and suffix renderers in configured controls', () => {
		const Prefix = () => null;
		const field: Field< Item > = {
			...builtin,
			Edit: { control: 'text', prefix: Prefix },
		};
		expect( DataForm.canUseUiOverlays( [ field ] ) ).toBe( false );
		Object.assign( Prefix, { supportsUiOverlays: true } );
		expect( DataForm.canUseUiOverlays( [ field ] ) ).toBe( true );
		expect(
			DataForm.canUseUiOverlays( [
				{ ...builtin, Edit: { control: 'text', suffix: 'px' } },
			] )
		).toBe( true );
	} );

	it( 'requires a declaration from the actual custom renderer', () => {
		const Edit = () => null;
		const field = { ...builtin, Edit };
		expect( DataForm.canUseUiOverlays( [ field ] ) ).toBe( false );
		Object.assign( Edit, { supportsUiOverlays: true } );
		expect( DataForm.canUseUiOverlays( [ field ] ) ).toBe( true );
		expect(
			DataForm.canUseUiOverlays( [ { ...field, Edit: () => null } ] )
		).toBe( false );
	} );

	it( 'does not inherit a declaration from another renderer', () => {
		const Parent = Object.assign( () => null, {
			supportsUiOverlays: true,
		} );
		const Edit = Object.setPrototypeOf( () => null, Parent );
		expect( DataForm.canUseUiOverlays( [ { ...builtin, Edit } ] ) ).toBe(
			false
		);
	} );

	it( 'keeps unverified rich descriptions in a legacy host', () => {
		const Description = () => <span>Custom help</span>;
		const field = { ...builtin, description: <Description /> };
		expect( DataForm.canUseUiOverlays( [ field ] ) ).toBe( false );
		expect(
			isUiOverlayContentCompatible( [
				'Help',
				<Description key="custom" />,
			] )
		).toBe( false );
		Object.assign( Description, { supportsUiOverlays: true } );
		expect( DataForm.canUseUiOverlays( [ field ] ) ).toBe( true );
	} );

	it.each( [ 'Edit', 'prefix' ] )(
		'observes a filtered %s without replacing the fields array',
		async ( target ) => {
			const hook = `test.DataForm.${ target }`;
			const Original = Object.assign( () => null, {
				supportsUiOverlays: true,
			} );
			const Filtered = withFilters( hook )(
				Original
			) as unknown as typeof Original;
			const fields: Field< Item >[] = [
				{
					...builtin,
					Edit:
						target === 'Edit'
							? Filtered
							: { control: 'text', prefix: Filtered },
				},
			];
			const { result, unmount } = renderHook( () =>
				useUiOverlaySupport( fields )
			);
			try {
				expect( result.current ).toBe( true );
				act( () => {
					addFilter( hook, 'test/replacement', () => () => null );
				} );
				await waitFor( () => expect( result.current ).toBe( false ) );
				act( () => {
					removeFilter( hook, 'test/replacement' );
				} );
				await waitFor( () => expect( result.current ).toBe( true ) );
			} finally {
				unmount();
				removeFilter( hook, 'test/replacement' );
			}
		}
	);

	it.each( [ 'memo', 'forwardRef' ] )(
		'renders a %s custom edit control',
		( wrapper ) => {
			const Edit =
				wrapper === 'memo'
					? memo( ( { data }: DataFormControlProps< Item > ) => (
							<input
								aria-label="Wrapped edit"
								defaultValue={ data.name }
							/>
						) )
					: forwardRef<
							HTMLInputElement,
							DataFormControlProps< Item >
						>( ( { data }, ref ) => (
							<input
								ref={ ref }
								aria-label="Wrapped edit"
								defaultValue={ data.name }
							/>
						) );
			render(
				<DataForm
					data={ { name: 'Initial value' } }
					fields={ [ { ...builtin, Edit } ] }
					form={ { fields: [ 'name' ] } }
					onChange={ () => {} }
				/>
			);
			expect(
				screen.getByRole( 'textbox', { name: 'Wrapped edit' } )
			).toHaveValue( 'Initial value' );
		}
	);
} );
