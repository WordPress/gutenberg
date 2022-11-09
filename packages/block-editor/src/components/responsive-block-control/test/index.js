/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { Fragment, useState } from '@wordpress/element';
import { SelectControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ResponsiveBlockControl from '../index';

const inputId = 'input-12345678';

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
			<SelectControl label={ labelComponent } options={ sizeOptions } />
			<p id={ device.id }>
				{ device.label } is used here for testing purposes to ensure we
				have access to details about the device.
			</p>
		</Fragment>
	);
};

describe( 'Basic rendering', () => {
	it( 'should render with required props', () => {
		const { container } = render(
			<ResponsiveBlockControl
				title="Padding"
				property="padding"
				renderDefaultControl={ renderTestDefaultControlComponent }
			/>
		);

		const activePropertyLabel = Array.from(
			container.querySelectorAll( 'legend' )
		).find( ( legend ) => legend.innerHTML === 'Padding' );

		const activeViewportLabel = Array.from(
			container.querySelectorAll( 'label' )
		).find( ( label ) => label.innerHTML.includes( 'All' ) );

		const defaultControl = container.querySelector(
			`#${ activeViewportLabel.getAttribute( 'for' ) }`
		);

		const toggleLabel = Array.from(
			container.querySelectorAll( 'label' )
		).filter( ( label ) =>
			label.innerHTML.includes(
				'Use the same padding on all screensizes'
			)
		);

		const toggleState = container.querySelector(
			'input[type="checkbox"]'
		).checked;

		const defaultControlGroup = container.querySelector(
			'.block-editor-responsive-block-control__group:not(.is-responsive)'
		);

		const responsiveControlGroup = container.querySelector(
			'.block-editor-responsive-block-control__group.is-responsive'
		);

		expect( container ).not.toBeEmptyDOMElement();

		expect( defaultControlGroup ).not.toBeNull();
		expect( responsiveControlGroup ).toBeNull();

		expect( activeViewportLabel ).not.toBeNull();
		expect( activePropertyLabel ).not.toBeNull();
		expect( defaultControl ).not.toBeNull();
		expect( toggleLabel ).not.toBeNull();
		expect( toggleState ).toBe( true );
	} );

	it( 'should not render without valid legend', () => {
		const { container } = render(
			<ResponsiveBlockControl
				property="padding"
				renderDefaultControl={ renderTestDefaultControlComponent }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render without valid property', () => {
		const { container } = render(
			<ResponsiveBlockControl
				title="Padding"
				renderDefaultControl={ renderTestDefaultControlComponent }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render without valid default control render prop', () => {
		const { container } = render(
			<ResponsiveBlockControl title="Padding" property="padding" />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render with custom label for toggle control when provided', () => {
		const customToggleLabel =
			'Utilise a matching padding value on all viewports';
		const { container } = render(
			<ResponsiveBlockControl
				title="Padding"
				property="padding"
				renderDefaultControl={ renderTestDefaultControlComponent }
				toggleLabel={ customToggleLabel }
			/>
		);

		const actualToggleLabel = container.querySelector(
			'label.components-toggle-control__label'
		).innerHTML;

		expect( actualToggleLabel ).toEqual( customToggleLabel );
	} );

	it( 'should pass custom label for default control group to the renderDefaultControl function when provided', () => {
		const customDefaultControlGroupLabel = 'Everything';

		const { container } = render(
			<ResponsiveBlockControl
				title="Padding"
				property="padding"
				renderDefaultControl={ renderTestDefaultControlComponent }
				defaultLabel={ customDefaultControlGroupLabel }
			/>
		);

		const defaultControlLabel = Array.from(
			container.querySelectorAll( 'label' )
		).find( ( label ) => label.innerHTML.includes( 'Everything' ) );

		expect( defaultControlLabel ).not.toBeNull();
	} );
} );

describe( 'Default and Responsive modes', () => {
	it( 'should render in responsive mode when isResponsive prop is set to true', () => {
		const { container } = render(
			<ResponsiveBlockControl
				title="Padding"
				property="padding"
				isResponsive={ true }
				renderDefaultControl={ renderTestDefaultControlComponent }
			/>
		);

		const defaultControlGroup = container.querySelector(
			'.block-editor-responsive-block-control__group:not(.is-responsive)'
		);
		const responsiveControlGroup = container.querySelector(
			'.block-editor-responsive-block-control__group.is-responsive'
		);

		expect( defaultControlGroup ).toBeNull();
		expect( responsiveControlGroup ).not.toBeNull();
	} );

	it( 'should render controls for a set of custom viewports in responsive mode when provided', () => {
		const customViewportSet = [
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

		const mockRenderDefaultControl = jest.fn(
			renderTestDefaultControlComponent
		);

		const { container } = render(
			<ResponsiveBlockControl
				title="Padding"
				property="padding"
				isResponsive={ true }
				renderDefaultControl={ mockRenderDefaultControl }
				viewports={ customViewportSet }
			/>
		);

		const defaultRenderControlCall = 1;

		// Get array of labels which match those in the custom viewports provided
		const responsiveViewportsLabels = Array.from(
			container.querySelectorAll( 'label' )
		).filter( ( label ) => {
			const labelText = label.innerHTML;
			// Is the label one of those in the custom device set?
			return !! customViewportSet.find( ( deviceName ) =>
				labelText.includes( deviceName.label )
			);
		} );

		expect( responsiveViewportsLabels ).toHaveLength(
			customViewportSet.length
		);
		expect( mockRenderDefaultControl ).toHaveBeenCalledTimes(
			customViewportSet.length + defaultRenderControlCall
		);
	} );

	it( 'should switch between default and responsive modes when interacting with toggle control', async () => {
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );
		const ResponsiveBlockControlConsumer = () => {
			const [ isResponsive, setIsResponsive ] = useState( false );

			return (
				<ResponsiveBlockControl
					title="Padding"
					property="padding"
					isResponsive={ isResponsive }
					onIsResponsiveChange={ () => {
						setIsResponsive( ! isResponsive );
					} }
					renderDefaultControl={ renderTestDefaultControlComponent }
				/>
			);
		};

		const { container } = render( <ResponsiveBlockControlConsumer /> );

		let defaultControlGroup = container.querySelector(
			'.block-editor-responsive-block-control__group:not(.is-responsive)'
		);
		let responsiveControlGroup = container.querySelector(
			'.block-editor-responsive-block-control__group.is-responsive'
		);

		// Select elements based on what the user can see.
		const toggleLabel = Array.from(
			container.querySelectorAll( 'label' )
		).find( ( label ) =>
			label.innerHTML.includes(
				'Use the same padding on all screensizes'
			)
		);
		const toggleInput = container.querySelector(
			`#${ toggleLabel.getAttribute( 'for' ) }`
		);

		// Initial mode (default)
		expect( defaultControlGroup ).not.toBeNull();
		expect( responsiveControlGroup ).toBeNull();

		// Toggle to "responsive" mode.
		await user.click( toggleInput );

		defaultControlGroup = container.querySelector(
			'.block-editor-responsive-block-control__group:not(.is-responsive)'
		);
		responsiveControlGroup = container.querySelector(
			'.block-editor-responsive-block-control__group.is-responsive'
		);

		expect( defaultControlGroup ).toBeNull();
		expect( responsiveControlGroup ).not.toBeNull();

		// Toggle back to "default" mode.
		await user.click( toggleInput );

		defaultControlGroup = container.querySelector(
			'.block-editor-responsive-block-control__group:not(.is-responsive)'
		);
		responsiveControlGroup = container.querySelector(
			'.block-editor-responsive-block-control__group.is-responsive'
		);

		expect( defaultControlGroup ).not.toBeNull();
		expect( responsiveControlGroup ).toBeNull();
	} );

	it( 'should render custom responsive controls when renderResponsiveControls prop is provided and in responsive mode', () => {
		const spyRenderDefaultControl = jest.fn();

		const mockRenderResponsiveControls = jest.fn( ( viewports ) => {
			return viewports.map( ( { id, label } ) => {
				return (
					<Fragment key={ `${ inputId }-${ id }` }>
						<label htmlFor={ `${ inputId }-${ id }` }>
							Custom Viewport { label }
						</label>
						<input
							id={ `${ inputId }-${ id }` }
							defaultValue={ label }
							type="range"
						/>
					</Fragment>
				);
			} );
		} );

		const { container } = render(
			<ResponsiveBlockControl
				title="Padding"
				property="padding"
				isResponsive={ true }
				renderDefaultControl={ spyRenderDefaultControl }
				renderResponsiveControls={ mockRenderResponsiveControls }
			/>
		);

		// The user should see "range" controls so we can legitimately query for them here.
		const customControls = Array.from(
			container.querySelectorAll( 'input[type="range"]' )
		);

		// Also called because default control rendeer function is always called
		// (for convenience) even though it's not displayed in output.
		expect( spyRenderDefaultControl ).toHaveBeenCalledTimes( 1 );

		expect( mockRenderResponsiveControls ).toHaveBeenCalledTimes( 1 );

		expect( customControls ).toHaveLength( 3 );
	} );
} );
