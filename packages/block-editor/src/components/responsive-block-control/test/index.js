/**
 * External dependencies
 */
import { render, unmountComponentAtNode } from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { uniqueId } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import {
	SelectControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ResponsiveBlockControl from '../index';

let container = null;
beforeEach( () => {
	// setup a DOM element as a render target
	container = document.createElement( 'div' );
	document.body.appendChild( container );
} );

afterEach( () => {
	// cleanup on exiting
	unmountComponentAtNode( container );
	container.remove();
	container = null;
} );

const inputId = uniqueId();

const sizeOptions = [
	{
		label: 'Please select',
		value: '',
	},
	{
		label: 'Small',
		value: 'small',
	},
	{
		label: 'Medium',
		value: 'medium',
	},
	{
		label: 'Large',
		value: 'large',
	},
];

const renderTestDefaultControlComponent = ( labelComponent, device ) => {
	return (
		<Fragment>
			<SelectControl
				label={ labelComponent }
				options={ sizeOptions }
			/>
			<p id={ device.id }>
				{ device.label } is used here for testing purposes to ensure we have access
				to details about the device.
			</p>
		</Fragment>
	);
};

describe( 'Basic rendering', () => {
	it( 'should render with required props', () => {
		act( () => {
			render(
				<ResponsiveBlockControl
					title="Padding"
					property="padding"
					renderDefaultControl={ renderTestDefaultControlComponent }
				/>, container
			);
		} );

		const activePropertyLabel = Array.from( container.querySelectorAll( 'legend' ) ).find( ( legend ) => legend.innerHTML === 'Padding' );

		const activeDeviceLabel = Array.from( container.querySelectorAll( 'label' ) ).find( ( label ) => label.innerHTML.includes( 'All' ) );

		const defaultControl = container.querySelector( `#${ activeDeviceLabel.getAttribute( 'for' ) }` );

		const toggleLabel = Array.from( container.querySelectorAll( 'label' ) ).filter( ( label ) => label.innerHTML.includes( 'Use the same padding on all screensizes' ) );

		const toggleState = container.querySelector( 'input[type="checkbox"]' ).checked;

		const defaultControlGroup = container.querySelector( '.block-editor-responsive-block-control__group--default' );

		const responsiveControlGroup = container.querySelector( '.block-editor-responsive-block-control__group--responsive' );

		expect( container.innerHTML ).not.toBe( '' );

		expect( defaultControlGroup ).not.toBeNull();
		expect( responsiveControlGroup ).toBeNull();

		expect( activeDeviceLabel ).not.toBeNull();
		expect( activePropertyLabel ).not.toBeNull();
		expect( defaultControl ).not.toBeNull();
		expect( toggleLabel ).not.toBeNull();
		expect( toggleState ).toBe( true );
		expect( container.innerHTML ).toMatchSnapshot();
	} );

	it( 'should not render without valid legend', () => {
		act( () => {
			render(
				<ResponsiveBlockControl
					property="padding"
					renderDefaultControl={ renderTestDefaultControlComponent }
				/>, container
			);
		} );

		expect( container.innerHTML ).toBe( '' );
	} );

	it( 'should not render without valid property', () => {
		act( () => {
			render(
				<ResponsiveBlockControl
					title="Padding"
					renderDefaultControl={ renderTestDefaultControlComponent }
				/>, container
			);
		} );

		expect( container.innerHTML ).toBe( '' );
	} );

	it( 'should not render without valid default control render prop', () => {
		act( () => {
			render(
				<ResponsiveBlockControl
					title="Padding"
					property="padding"
				/>, container
			);
		} );

		expect( container.innerHTML ).toBe( '' );
	} );

	it( 'should render with custom label for toggle control when provided', () => {
		const customToggleLabel = 'Utilise a matching padding value on all viewports';
		act( () => {
			render(
				<ResponsiveBlockControl
					title="Padding"
					property="padding"
					renderDefaultControl={ renderTestDefaultControlComponent }
					toggleLabel={ customToggleLabel }
				/>, container
			);
		} );

		const actualToggleLabel = container.querySelector( 'label.components-toggle-control__label' ).innerHTML;

		expect( actualToggleLabel ).toEqual( customToggleLabel );
	} );

	it( 'should pass custom label for default control group to the renderDefaultControl function when provided', () => {
		const customDefaultControlGroupLabel = 'Everything';

		act( () => {
			render(
				<ResponsiveBlockControl
					title="Padding"
					property="padding"
					renderDefaultControl={ renderTestDefaultControlComponent }
					defaultLabel={ customDefaultControlGroupLabel }
				/>, container
			);
		} );

		const defaultControlLabel = Array.from( container.querySelectorAll( 'label' ) ).find( ( label ) => label.innerHTML.includes( 'Everything' ) );

		expect( defaultControlLabel ).not.toBeNull();
	} );
} );

describe( 'Default and Responsive modes', () => {
	it( 'should render in responsive mode when responsiveControlsActive prop is set to true', () => {
		act( () => {
			render(
				<ResponsiveBlockControl
					title="Padding"
					property="padding"
					responsiveControlsActive={ true }
					renderDefaultControl={ renderTestDefaultControlComponent }
				/>, container
			);
		} );

		const defaultControlGroup = container.querySelector( '.block-editor-responsive-block-control__group--default' );
		const responsiveControlGroup = container.querySelector( '.block-editor-responsive-block-control__group--responsive' );

		expect( defaultControlGroup ).toBeNull();
		expect( responsiveControlGroup ).not.toBeNull();
	} );

	it( 'should render a set of custom devices in responsive mode when provided', () => {
		const customDeviceSet = [
			{
				id: 'tiny',
				label: 'Tiny',
			},
			{
				id: 'small',
				label: 'Small',
			},
			{
				id: 'medium',
				label: 'Medium',
			},
			{
				id: 'huge',
				label: 'Huge',
			},
		];

		const mockRenderDefaultControl = jest.fn( renderTestDefaultControlComponent );

		act( () => {
			render(
				<ResponsiveBlockControl
					title="Padding"
					property="padding"
					responsiveControlsActive={ true }
					renderDefaultControl={ mockRenderDefaultControl }
					devices={ customDeviceSet }
				/>, container
			);
		} );

		const defaultRenderControlCall = 1;

		// Get array of labels which match those in the custom devices provided
		const responsiveDevicesLabels = Array.from( container.querySelectorAll( 'label' ) ).filter( ( label ) => {
			const labelText = label.innerHTML;
			// Is the label one of those in the custom device set?
			return !! customDeviceSet.find( ( deviceName ) => labelText.includes( deviceName.label ) );
		} );

		expect( responsiveDevicesLabels ).toHaveLength( customDeviceSet.length );
		expect( mockRenderDefaultControl ).toHaveBeenCalledTimes( customDeviceSet.length + defaultRenderControlCall );
	} );

	it( 'should switch between default and responsive modes when interacting with toggle control', () => {
		act( () => {
			render(
				<ResponsiveBlockControl
					title="Padding"
					property="padding"
					renderDefaultControl={ renderTestDefaultControlComponent }
				/>, container
			);
		} );

		let defaultControlGroup = container.querySelector( '.block-editor-responsive-block-control__group--default' );
		let responsiveControlGroup = container.querySelector( '.block-editor-responsive-block-control__group--responsive' );

		// Select elements based on what the user can see
		const toggleLabel = Array.from( container.querySelectorAll( 'label' ) ).find( ( label ) => label.innerHTML.includes( 'Use the same padding on all screensizes' ) );
		const toggleInput = container.querySelector( `#${ toggleLabel.getAttribute( 'for' ) }` );

		// Initial mode (default)
		expect( defaultControlGroup ).not.toBeNull();
		expect( responsiveControlGroup ).toBeNull();

		// Toggle to "responsive" mode
		act( () => {
			Simulate.change( toggleInput, { target: { checked: false } } );
		} );

		defaultControlGroup = container.querySelector( '.block-editor-responsive-block-control__group--default' );
		responsiveControlGroup = container.querySelector( '.block-editor-responsive-block-control__group--responsive' );

		expect( defaultControlGroup ).toBeNull();
		expect( responsiveControlGroup ).not.toBeNull();

		// Toggle back to "default" mode
		act( () => {
			Simulate.change( toggleInput, { target: { checked: true } } );
		} );

		defaultControlGroup = container.querySelector( '.block-editor-responsive-block-control__group--default' );
		responsiveControlGroup = container.querySelector( '.block-editor-responsive-block-control__group--responsive' );

		expect( defaultControlGroup ).not.toBeNull();
		expect( responsiveControlGroup ).toBeNull();
	} );

	it( 'should render custom responsive controls when renderResponsiveControls is provided and in responsive mode ', () => {
		const spyRenderDefaultControl = jest.fn();

		const mockRenderResponsiveControls = jest.fn( ( devices ) => {
			return devices.map( ( { id, label } ) => {
				return (
					<Fragment key={ `${ inputId }-${ id }` }>
						<label htmlFor={ `${ inputId }-${ id }` }>Custom Device { label }</label>
						<input
							id={ `${ inputId }-${ id }` }
							defaultValue={ label }
							type="range"
						/>
					</Fragment>
				);
			} );
		} );

		act( () => {
			render(
				<ResponsiveBlockControl
					title="Padding"
					property="padding"
					renderDefaultControl={ spyRenderDefaultControl }
					renderResponsiveControls={ mockRenderResponsiveControls }
					responsiveControlsActive={ true }
				/>, container
			);
		} );

		// The user should see "range" controls so we can legitimately query for them here
		const customControls = Array.from( container.querySelectorAll( 'input[type="range"]' ) );

		// Also called because default control rendeer function is always called
		// (for convenience) even though it's not displayed in output.
		expect( spyRenderDefaultControl ).toHaveBeenCalledTimes( 1 );

		expect( mockRenderResponsiveControls ).toHaveBeenCalledTimes( 1 );

		expect( customControls ).toHaveLength( 3 );
	} );

	it( 'should call onIsResponsiveModeChange callback when responsive mode is toggled on/off ', () => {
		const onIsResponsiveModeChangeSpy = jest.fn();

		act( () => {
			render(
				<ResponsiveBlockControl
					title="Padding"
					property="padding"
					renderDefaultControl={ renderTestDefaultControlComponent }
					onIsResponsiveModeChange={ onIsResponsiveModeChangeSpy }
				/>, container
			);
		} );

		const toggleInput = container.querySelector( '.block-editor-responsive-block-control__toggle input' );

		// Initial render
		expect( onIsResponsiveModeChangeSpy ).toHaveBeenCalledWith( false );

		// Toggle to "responsive" mode
		act( () => {
			Simulate.change( toggleInput, { target: { checked: false } } );
		} );

		expect( onIsResponsiveModeChangeSpy ).toHaveBeenCalledWith( true );

		// Revert to "default" mode
		act( () => {
			Simulate.change( toggleInput, { target: { checked: true } } );
		} );

		expect( onIsResponsiveModeChangeSpy ).toHaveBeenCalledWith( false );
	} );
} );

