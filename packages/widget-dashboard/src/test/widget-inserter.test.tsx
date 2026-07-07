/**
 * External dependencies
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget } from '../types';

function PreviewWidget( {
	attributes,
}: WidgetRenderProps< { label?: string } > ) {
	return <div data-testid="widget-content">{ attributes?.label ?? '—' }</div>;
}

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'wordpress/welcome',
		title: 'Welcome',
		renderModule: 'welcome-module',
		example: { attributes: { label: 'welcome-example' } },
	},
	{
		apiVersion: 1,
		name: 'wordpress/notes',
		title: 'Notes',
		renderModule: 'notes-module',
		example: { attributes: { label: 'notes-example' } },
	},
];

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: PreviewWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

interface HarnessProps {
	initialLayout?: DashboardWidget[];
	onLayoutChange?: ( layout: DashboardWidget[] ) => void;
}

function Harness( {
	initialLayout = [],
	onLayoutChange: onChange,
}: HarnessProps ) {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( initialLayout );
	const [ editMode, setEditMode ] = useState( true );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ ( next ) => {
				setLayout( next );
				onChange?.( next );
			} }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ setEditMode }
			resolveWidgetModule={ resolveWidgetModule }
		/>
	);
}

describe( 'WidgetDashboard.WidgetInserter', () => {
	it( 'is hidden until the "Add widget" trigger is clicked', () => {
		render( <Harness /> );
		expect(
			screen.queryByRole( 'dialog', { name: 'Add widget' } )
		).not.toBeInTheDocument();
	} );

	it( 'opens after clicking the "Add widget" trigger', async () => {
		const user = userEvent.setup();
		render( <Harness /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Add widget' } )
		);

		expect(
			await screen.findByRole( 'dialog', { name: 'Add widget' } )
		).toBeInTheDocument();
	} );

	it( 'inserts the selected widget type into the layout on Done', async () => {
		const user = userEvent.setup();
		const onLayoutChange = jest.fn();
		render( <Harness onLayoutChange={ onLayoutChange } /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Add widget' } )
		);

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Add widget',
		} );
		const options = within( dialog ).getAllByRole( 'option' );
		expect( options ).toHaveLength( widgetTypes.length );

		await user.click( options[ 0 ] );
		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Select' } )
		);

		// Inserts stay in staging until Done.
		expect( onLayoutChange ).not.toHaveBeenCalled();

		await waitFor( () =>
			expect(
				screen.queryByRole( 'dialog', { name: 'Add widget' } )
			).not.toBeInTheDocument()
		);

		await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

		expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
		const [ updated ] = onLayoutChange.mock.calls[ 0 ];
		expect( updated ).toHaveLength( 1 );
		expect( updated[ 0 ] ).toMatchObject( {
			type: 'wordpress/welcome',
			attributes: { label: 'welcome-example' },
		} );
		expect( updated[ 0 ].uuid ).toEqual( expect.any( String ) );
	} );

	it( 'inserts multiple widgets via multi-select in a single layout change', async () => {
		const user = userEvent.setup();
		const onLayoutChange = jest.fn();
		render( <Harness onLayoutChange={ onLayoutChange } /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Add widget' } )
		);

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Add widget',
		} );
		const options = within( dialog ).getAllByRole( 'option' );

		await user.click( options[ 0 ] );
		await user.click( options[ 1 ] );

		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Select' } )
		);

		await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

		expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
		const [ updated ] = onLayoutChange.mock.calls[ 0 ];
		expect( updated ).toHaveLength( 2 );
		expect( updated.map( ( w: DashboardWidget ) => w.type ) ).toEqual( [
			'wordpress/welcome',
			'wordpress/notes',
		] );
	} );

	it( 'preserves existing widgets when appending new ones', async () => {
		const user = userEvent.setup();
		const onLayoutChange = jest.fn();
		const existing: DashboardWidget = {
			uuid: 'existing-1',
			type: 'wordpress/welcome',
			attributes: { label: 'kept' },
			placement: { width: 1, height: 1 },
		};

		render(
			<Harness
				initialLayout={ [ existing ] }
				onLayoutChange={ onLayoutChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Add widget' } )
		);

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Add widget',
		} );
		await user.click( within( dialog ).getAllByRole( 'option' )[ 1 ] );
		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Select' } )
		);

		await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

		const [ updated ] = onLayoutChange.mock.calls[ 0 ];
		expect( updated ).toHaveLength( 2 );
		expect( updated[ 0 ] ).toEqual( existing );
		expect( updated[ 1 ] ).toMatchObject( { type: 'wordpress/notes' } );
	} );
} );
