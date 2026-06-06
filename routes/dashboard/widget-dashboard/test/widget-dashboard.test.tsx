/**
 * External dependencies
 */
import '@testing-library/jest-dom';
import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WidgetDashboard } from '../widget-dashboard';
import type {
	ResolveWidgetModule,
	DashboardWidget,
	WidgetRenderProps,
	WidgetType,
} from '../types';

type Attrs = { greeting: string };

function TestWidget( {
	attributes,
	setAttributes,
}: WidgetRenderProps< Attrs > ) {
	return (
		<div>
			<p data-testid="greeting">{ attributes.greeting }</p>
			<button
				onClick={ () => setAttributes?.( { greeting: 'updated' } ) }
			>
				Update
			</button>
		</div>
	);
}

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'test/greet',
		title: 'Greet',
		renderModule: 'test-greet-module',
	},
];

const resolveWidgetModule: ResolveWidgetModule = async ( id ) => {
	if ( id === 'test-greet-module' ) {
		return {
			default: TestWidget as ComponentType<
				WidgetRenderProps< unknown >
			>,
		};
	}
	throw new Error( `Unknown module: ${ id }` );
};

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
	const [ layout, setLayout ] = useState( initialLayout );
	const [ editMode, setEditMode ] = useState( false );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ ( next ) => {
				setLayout( next as DashboardWidget< Attrs >[] );
				onLayoutChange?.( next );
			} }
			widgetTypes={ widgetTypes }
			resolveWidgetModule={ resolveWidgetModule }
			editMode={ editMode }
			onEditChange={ setEditMode }
		/>
	);
}

describe( 'WidgetDashboard', () => {
	it( 'resolves the widget module and renders attributes', async () => {
		render( <Harness /> );

		expect( await screen.findByTestId( 'greeting' ) ).toHaveTextContent(
			'hello'
		);
	} );

	it( 'threads setAttributes into onLayoutChange on commit with merged attributes', async () => {
		const onChange = jest.fn();
		render( <Harness onLayoutChange={ onChange } /> );

		const button = await screen.findByRole( 'button', {
			name: 'Update',
		} );
		await userEvent.click( button );

		// Attribute changes stay in staging until commit.
		expect( onChange ).not.toHaveBeenCalled();
		expect( screen.getByTestId( 'greeting' ) ).toHaveTextContent(
			'updated'
		);

		// Enter edit mode to surface the Done button, then commit.
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Customize' } )
		);
		await userEvent.click( screen.getByRole( 'button', { name: 'Done' } ) );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		const [ updated ] = onChange.mock.calls[ 0 ];
		expect( updated ).toHaveLength( 1 );
		expect( updated[ 0 ] ).toMatchObject( {
			uuid: 'w1',
			type: 'test/greet',
			attributes: { greeting: 'updated' },
		} );
	} );

	it( 'shows a loading placeholder while widget types are resolving', () => {
		render(
			<WidgetDashboard
				layout={ [
					{
						uuid: 'w1',
						type: 'test/greet',
						placement: { width: 1, height: 1 },
					},
				] }
				onLayoutChange={ () => {} }
				widgetTypes={ [] }
				isResolvingWidgetTypes
				resolveWidgetModule={ resolveWidgetModule }
			/>
		);

		expect(
			screen.getByRole( 'region', { name: 'Loading' } )
		).toBeInTheDocument();
		expect(
			screen.queryByText( 'Widget is no longer available.' )
		).not.toBeInTheDocument();
	} );

	it( 'shows an unavailable placeholder for an unknown widget type (no crash)', () => {
		render(
			<WidgetDashboard
				layout={ [
					{
						uuid: 'w1',
						type: 'does/not-exist',
						placement: { width: 1, height: 1 },
					},
				] }
				onLayoutChange={ () => {} }
				widgetTypes={ widgetTypes }
				resolveWidgetModule={ resolveWidgetModule }
			/>
		);
		expect( screen.queryByTestId( 'greeting' ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'region', { name: 'Missing widget' } )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Widget is no longer available.' )
		).toBeInTheDocument();
		expect( screen.getByText( 'does/not-exist' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'heading', { level: 3 } )
		).not.toBeInTheDocument();
	} );

	it( 'renders the NoWidgetsState compound when layout is empty', () => {
		render(
			<WidgetDashboard
				layout={ [] }
				onLayoutChange={ () => {} }
				widgetTypes={ widgetTypes }
				resolveWidgetModule={ resolveWidgetModule }
			>
				<WidgetDashboard.NoWidgetsState>
					<p>Nothing here yet</p>
				</WidgetDashboard.NoWidgetsState>
				<WidgetDashboard.Widgets />
			</WidgetDashboard>
		);
		expect( screen.getByText( 'Nothing here yet' ) ).toBeInTheDocument();
	} );
} );
