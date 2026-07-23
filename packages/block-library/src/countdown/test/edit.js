/**
 * External dependencies
 */
import { render, screen, fireEvent, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Edit, { getUTCDateFromSiteTime } from '../edit';

jest.mock( '@wordpress/block-editor', () => {
	const InnerBlocksMock = () => <div data-testid="inner-blocks" />;
	InnerBlocksMock.ButtonBlockAppender = 'button-appender';
	return {
		useBlockProps: () => ( {} ),
		InspectorControls: ( { children } ) => <>{ children }</>,
		InnerBlocks: InnerBlocksMock,
		LinkControl: ( { value, onChange } ) => (
			<input
				data-testid="link-control"
				aria-label="Redirect URL"
				value={ value?.url || '' }
				onChange={ ( e ) => onChange( { url: e.target.value } ) }
			/>
		),
	};
} );

jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( { children } ) => <div>{ children }</div>,
	BaseControl: ( { label, children } ) => (
		<div>
			<label htmlFor="countdown-redirect-url">{ label }</label>
			{ children }
		</div>
	),
	ToggleControl: ( { label, checked, onChange, help } ) => (
		<label htmlFor="countdown-toggle-control">
			{ label }
			<input
				type="checkbox"
				checked={ !! checked }
				onChange={ onChange }
				aria-label={ label }
			/>
			{ help && <span>{ help }</span> }
		</label>
	),
	DateTimePicker: ( { label } ) => (
		<div>
			<span>{ label }</span>
		</div>
	),
	TextControl: ( { label, value, onChange } ) => (
		<label htmlFor="countdown-text-control">
			{ label }
			<input
				aria-label={ label }
				value={ value }
				onChange={ ( event ) => onChange( event.target.value ) }
			/>
		</label>
	),
	SelectControl: ( { label, value, options, onChange } ) => (
		<label htmlFor="countdown-select-control">
			{ label }
			<select
				aria-label={ label }
				value={ value }
				onChange={ ( event ) => onChange( event.target.value ) }
			>
				{ options.map( ( option ) => (
					<option key={ option.value } value={ option.value }>
						{ option.label }
					</option>
				) ) }
			</select>
		</label>
	),
	ColorPalette: ( { onChange } ) => (
		<button onClick={ () => onChange( '#123456' ) }>set-color</button>
	),
} ) );

jest.mock( '@wordpress/date', () => ( {
	getSettings: jest.fn( () => ( {
		timezone: { offset: 0 },
	} ) ),
} ) );

const baseAttributes = {
	endTime: '',
	showDays: true,
	showHours: true,
	showMinutes: true,
	showSeconds: true,
	actionOnEnd: 'hide',
	actionValue: '',
	bgColor: '#ffffff',
	borderColor: '#000000',
	innerBlocksBehavior: 'revealOnEnd',
	isEvergreen: false,
	evergreenDays: 0,
	evergreenHours: 0,
	evergreenMinutes: 15,
};

function setup( overrides = {} ) {
	const setAttributes = jest.fn();
	const attributes = { ...baseAttributes, ...overrides };
	const utils = render(
		<Edit attributes={ attributes } setAttributes={ setAttributes } />
	);
	return { ...utils, setAttributes, attributes };
}

describe( 'Countdown block Edit component', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		jest.setSystemTime( new Date( '2025-01-01T00:00:00Z' ) );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'shows the DateTimePicker when not in evergreen mode', () => {
		setup( { isEvergreen: false } );
		expect( screen.getByText( 'End Time' ) ).toBeInTheDocument();
	} );

	it( 'shows Days/Hours/Minutes duration inputs when evergreen mode is on', () => {
		setup( { isEvergreen: true } );
		expect( screen.getByLabelText( 'Days' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Hours' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Minutes' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'End Time' ) ).not.toBeInTheDocument();
	} );

	it( 'toggles isEvergreen via the Evergreen Mode control', () => {
		const { setAttributes } = setup( { isEvergreen: false } );
		fireEvent.click( screen.getByLabelText( 'Evergreen Mode' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { isEvergreen: true } );
	} );

	it( 'clamps evergreen duration fields to non-negative integers', () => {
		const { setAttributes } = setup( { isEvergreen: true } );
		const daysInput = screen.getByLabelText( 'Days' );

		fireEvent.change( daysInput, { target: { value: '-5' } } );
		expect( setAttributes ).toHaveBeenCalledWith( { evergreenDays: 0 } );

		fireEvent.change( daysInput, { target: { value: '7' } } );
		expect( setAttributes ).toHaveBeenCalledWith( { evergreenDays: 7 } );

		fireEvent.change( daysInput, { target: { value: 'abc' } } );
		expect( setAttributes ).toHaveBeenCalledWith( { evergreenDays: 0 } );
	} );

	it( 'preserves an existing actionValue when switching actionOnEnd', () => {
		const { setAttributes } = setup( {
			actionOnEnd: 'hide',
			actionValue: 'My custom URL',
		} );

		fireEvent.change( screen.getByLabelText( 'Action on End' ), {
			target: { value: 'showMessage' },
		} );

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( { actionValue: 'My custom URL' } )
		);
	} );

	it( 'applies a sensible default actionValue when none exists yet', () => {
		const { setAttributes } = setup( {
			actionOnEnd: 'hide',
			actionValue: '',
		} );

		fireEvent.change( screen.getByLabelText( 'Action on End' ), {
			target: { value: 'redirect' },
		} );

		expect( setAttributes ).toHaveBeenCalledWith(
			expect.objectContaining( { actionValue: 'https://example.com' } )
		);
	} );

	it( 'shows the Message field only when actionOnEnd is showMessage', () => {
		setup( { actionOnEnd: 'showMessage', actionValue: 'Sale over' } );
		expect(
			screen.getByLabelText( 'Message to Display' )
		).toBeInTheDocument();
	} );

	it( 'shows the Redirect URL field only when actionOnEnd is redirect', () => {
		setup( {
			actionOnEnd: 'redirect',
			actionValue: 'https://example.com',
		} );
		expect( screen.getByLabelText( 'Redirect URL' ) ).toBeInTheDocument();
	} );

	it( 'does not show Message or Redirect fields for hide/none', () => {
		setup( { actionOnEnd: 'hide' } );
		expect(
			screen.queryByLabelText( 'Message to Display' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByLabelText( 'Redirect URL' )
		).not.toBeInTheDocument();
	} );

	it( 'renders zeroed-out digits immediately when actionOnEnd is "none" and time has already passed', () => {
		setup( {
			endTime: '2000-01-01T00:00:00',
			actionOnEnd: 'none',
		} );

		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		const zeroValues = screen.getAllByText( '0', {
			selector: '.countdown-box span',
		} );

		expect( zeroValues ).toHaveLength( 4 );

		expect( screen.getByText( 'Days' ) ).toBeInTheDocument();
	} );

	it( 'falls back to the "Countdown Ended" message once time expires (non-none actions)', () => {
		setup( {
			endTime: '2000-01-01T00:00:00',
			actionOnEnd: 'hide',
		} );

		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		expect( screen.getByText( 'Countdown Ended' ) ).toBeInTheDocument();
	} );

	it( 'shows a custom end message when actionOnEnd is showMessage and time has passed', () => {
		setup( {
			endTime: '2000-01-01T00:00:00',
			actionOnEnd: 'showMessage',
			actionValue: 'Sale Ended!',
		} );

		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		expect( screen.getByText( 'Sale Ended!' ) ).toBeInTheDocument();
	} );

	it( 'only renders boxes for the enabled show* toggles', () => {
		setup( {
			endTime: '2099-01-01T00:00:00',
			showDays: false,
			showHours: true,
			showMinutes: false,
			showSeconds: false,
		} );

		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		expect( screen.queryByText( 'Days' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Hours' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Minutes' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Seconds' ) ).not.toBeInTheDocument();
	} );

	it( 'updates innerBlocksBehavior via the select control', () => {
		const { setAttributes } = setup( {
			innerBlocksBehavior: 'revealOnEnd',
		} );

		fireEvent.change( screen.getByLabelText( 'Inner Blocks Behavior' ), {
			target: { value: 'hideOnEnd' },
		} );

		expect( setAttributes ).toHaveBeenCalledWith( {
			innerBlocksBehavior: 'hideOnEnd',
		} );
	} );

	it( 'updates bgColor and borderColor via the color palettes', () => {
		const { setAttributes } = setup();
		const [ bgButton, borderButton ] = screen.getAllByText( 'set-color' );

		fireEvent.click( bgButton );
		expect( setAttributes ).toHaveBeenCalledWith( { bgColor: '#123456' } );

		fireEvent.click( borderButton );
		expect( setAttributes ).toHaveBeenCalledWith( {
			borderColor: '#123456',
		} );
	} );
} );

describe( 'getUTCDateFromSiteTime()', () => {
	it( 'returns null for an empty string', () => {
		expect( getUTCDateFromSiteTime( '' ) ).toBeNull();
	} );

	it( 'trusts strings that already carry an explicit "Z" offset', () => {
		const result = getUTCDateFromSiteTime( '2025-06-01T10:00:00Z' );
		expect( result.toISOString() ).toBe( '2025-06-01T10:00:00.000Z' );
	} );

	it( 'trusts strings that already carry an explicit numeric offset', () => {
		const result = getUTCDateFromSiteTime( '2025-06-01T10:00:00+05:30' );
		expect( result.toISOString() ).toBe( '2025-06-01T04:30:00.000Z' );
	} );

	it( 'shifts a timezoneless string by a positive site UTC offset', () => {
		require( '@wordpress/date' ).getSettings.mockReturnValueOnce( {
			timezone: { offset: 5.5 },
		} );

		const result = getUTCDateFromSiteTime( '2025-06-01T10:00:00' );

		// 10:00 in a UTC+5:30 site == 04:30 UTC.
		expect( result.toISOString() ).toBe( '2025-06-01T04:30:00.000Z' );
	} );

	it( 'shifts a timezoneless string by a negative site UTC offset', () => {
		require( '@wordpress/date' ).getSettings.mockReturnValueOnce( {
			timezone: { offset: -8 },
		} );

		const result = getUTCDateFromSiteTime( '2025-06-01T10:00:00' );

		// 10:00 in a UTC-8 site == 18:00 UTC.
		expect( result.toISOString() ).toBe( '2025-06-01T18:00:00.000Z' );
	} );

	it( 'treats a zero offset as already-UTC', () => {
		require( '@wordpress/date' ).getSettings.mockReturnValueOnce( {
			timezone: { offset: 0 },
		} );

		const result = getUTCDateFromSiteTime( '2025-06-01T10:00:00' );
		expect( result.toISOString() ).toBe( '2025-06-01T10:00:00.000Z' );
	} );
} );
