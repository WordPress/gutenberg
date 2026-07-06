/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ChildLayoutControl from '../';

jest.mock( '../../use-settings', () => ( {
	useSettings: () => [ undefined ],
} ) );

jest.mock( '@wordpress/data/src/components/use-select', () =>
	jest.fn( ( mapSelect ) => {
		if ( typeof mapSelect === 'function' ) {
			return mapSelect( () => ( {
				getBlockRootClientId: () => 'root-client-id',
			} ) );
		}

		return {
			getBlockAttributes: () => ( {} ),
			getBlockOrder: () => [],
		};
	} )
);

jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: () => ( {
		__unstableMarkNextChangeAsNotPersistent: jest.fn(),
		moveBlocksToPosition: jest.fn(),
	} ),
} ) );

describe( 'ChildLayoutControl', () => {
	const baseProps = {
		onChange: jest.fn(),
		parentLayout: {
			type: 'grid',
		},
		isShownByDefault: true,
		panelId: 'client-id',
	};

	afterEach( () => {
		jest.clearAllMocks();
	} );

	function renderControl( props ) {
		return render(
			<ToolsPanel
				label="Dimensions"
				resetAll={ jest.fn() }
				panelId="client-id"
			>
				<ChildLayoutControl { ...baseProps } { ...props } />
			</ToolsPanel>
		);
	}

	it( 'shows default grid span values for unset span controls by default', () => {
		renderControl( { value: {} } );

		expect(
			screen.getByRole( 'spinbutton', { name: 'Column span' } )
		).toHaveValue( 1 );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Row span' } )
		).toHaveValue( 1 );
	} );

	it( 'shows empty grid span values when defaults are hidden', () => {
		renderControl( { value: {}, showGridSpanDefaults: false } );

		expect(
			screen.getByRole( 'spinbutton', { name: 'Column span' } )
		).toHaveValue( null );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Row span' } )
		).toHaveValue( null );
	} );

	it( 'shows explicitly set grid span values when defaults are hidden', () => {
		renderControl( {
			value: {
				columnSpan: 1,
				rowSpan: 2,
			},
			showGridSpanDefaults: false,
		} );

		expect(
			screen.getByRole( 'spinbutton', { name: 'Column span' } )
		).toHaveValue( 1 );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Row span' } )
		).toHaveValue( 2 );
	} );

	it( 'sets a numeric span when entering 1 into an empty span control', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		renderControl( {
			value: {},
			onChange,
			showGridSpanDefaults: false,
		} );

		await user.type(
			screen.getByRole( 'spinbutton', { name: 'Column span' } ),
			'1'
		);

		expect( onChange ).toHaveBeenCalledWith( {
			columnStart: undefined,
			rowStart: undefined,
			rowSpan: undefined,
			columnSpan: 1,
		} );
	} );

	it( 'shows legacy fixed flex sizing as max', () => {
		renderControl( {
			parentLayout: {
				type: 'flex',
				orientation: 'horizontal',
			},
			value: {
				selfStretch: 'fixed',
				flexSize: '320px',
			},
		} );

		expect( screen.getByRole( 'radio', { name: 'Max' } ) ).toBeChecked();
	} );

	it( 'sets fixedNoShrink when selecting fixed flex sizing', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		renderControl( {
			parentLayout: {
				type: 'flex',
				orientation: 'horizontal',
			},
			value: {},
			onChange,
		} );

		await user.click( screen.getByRole( 'radio', { name: 'Fixed' } ) );

		expect( onChange ).toHaveBeenCalledWith( {
			selfStretch: 'fixedNoShrink',
			flexSize: undefined,
		} );
	} );

	it( 'sets legacy fixed when selecting max sizing', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		renderControl( {
			parentLayout: {
				type: 'flex',
				orientation: 'horizontal',
			},
			value: {
				selfStretch: 'fixedNoShrink',
				flexSize: '320px',
			},
			onChange,
		} );

		await user.click( screen.getByRole( 'radio', { name: 'Max' } ) );

		expect( onChange ).toHaveBeenCalledWith( {
			selfStretch: 'fixed',
			flexSize: '320px',
		} );
	} );
} );
