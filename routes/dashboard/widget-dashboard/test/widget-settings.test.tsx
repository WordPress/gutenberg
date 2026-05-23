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

/**
 * Internal dependencies
 */
import { WidgetDashboard } from '../widget-dashboard';
import type {
	DashboardWidget,
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '../types';

type Attrs = { greeting: string };

function TestWidget( {
	attributes,
}: WidgetRenderProps< { greeting?: string } > ) {
	return <p data-testid="greeting">{ attributes?.greeting ?? '' }</p>;
}

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'test/greet',
		title: 'Greet',
		renderModule: 'greet-module',
		attributes: [ { id: 'greeting', label: 'Greeting', type: 'text' } ],
		example: { attributes: { greeting: 'hi' } },
	},
];

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: TestWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

const initialLayout: DashboardWidget< Attrs >[] = [
	{
		uuid: 'w1',
		type: 'test/greet',
		attributes: { greeting: 'hello' },
		placement: { width: 2, height: 2 },
	},
];

function Harness( {
	onLayoutChange,
}: {
	onLayoutChange?: ( layout: DashboardWidget[] ) => void;
} ) {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( initialLayout );
	const [ editMode, setEditMode ] = useState( false );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ ( next ) => {
				setLayout( next );
				onLayoutChange?.( next );
			} }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ setEditMode }
			resolveWidgetModule={ resolveWidgetModule }
		/>
	);
}

describe( 'WidgetDashboard widget settings', () => {
	it( 'surfaces a per-instance settings gear in normal mode', async () => {
		render( <Harness /> );

		expect( await screen.findByTestId( 'greeting' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		).toBeInTheDocument();
	} );

	it( 'hides the gear while the layout is being edited', async () => {
		const user = userEvent.setup();
		render( <Harness /> );
		await screen.findByTestId( 'greeting' );

		await user.click( screen.getByRole( 'button', { name: 'Customize' } ) );

		expect(
			screen.queryByRole( 'button', { name: 'Widget settings' } )
		).not.toBeInTheDocument();
	} );

	it( 'stages attribute edits behind the drawer and publishes them on Save', async () => {
		const user = userEvent.setup();
		const onLayoutChange = jest.fn();
		render( <Harness onLayoutChange={ onLayoutChange } /> );
		await screen.findByTestId( 'greeting' );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		);

		const dialog = await screen.findByRole( 'dialog', {
			name: 'Greet settings',
		} );

		const input = within( dialog ).getByRole( 'textbox' );
		await user.clear( input );
		await user.type( input, 'updated' );

		// The live preview behind the drawer reflects the staged edit…
		expect( screen.getByTestId( 'greeting' ) ).toHaveTextContent(
			'updated'
		);
		// …but nothing is published until Save.
		expect( onLayoutChange ).not.toHaveBeenCalled();

		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Save' } )
		);

		expect( onLayoutChange ).toHaveBeenCalledTimes( 1 );
		const [ updated ] = onLayoutChange.mock.calls[ 0 ];
		expect( updated[ 0 ] ).toMatchObject( {
			uuid: 'w1',
			type: 'test/greet',
			attributes: { greeting: 'updated' },
		} );

		await waitFor( () =>
			expect(
				screen.queryByRole( 'dialog', { name: 'Greet settings' } )
			).not.toBeInTheDocument()
		);
	} );

	it( 'discards staged edits when the drawer is dismissed', async () => {
		const user = userEvent.setup();
		const onLayoutChange = jest.fn();
		render( <Harness onLayoutChange={ onLayoutChange } /> );
		await screen.findByTestId( 'greeting' );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget settings' } )
		);
		const dialog = await screen.findByRole( 'dialog', {
			name: 'Greet settings',
		} );
		const input = within( dialog ).getByRole( 'textbox' );
		await user.clear( input );
		await user.type( input, 'updated' );

		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Cancel' } )
		);

		expect( onLayoutChange ).not.toHaveBeenCalled();
		expect( screen.getByTestId( 'greeting' ) ).toHaveTextContent( 'hello' );
	} );

	it( 'shows no gear for a type that declares no attributes', async () => {
		render(
			<WidgetDashboard
				layout={ [
					{
						uuid: 'w1',
						type: 'test/plain',
						placement: { width: 1, height: 1 },
					},
				] }
				onLayoutChange={ () => {} }
				widgetTypes={ [
					{
						apiVersion: 1,
						name: 'test/plain',
						title: 'Plain',
						renderModule: 'greet-module',
					},
				] }
				resolveWidgetModule={ resolveWidgetModule }
			/>
		);
		await screen.findByTestId( 'greeting' );

		expect(
			screen.queryByRole( 'button', { name: /settings/i } )
		).not.toBeInTheDocument();
	} );
} );
