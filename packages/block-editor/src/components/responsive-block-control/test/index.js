/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
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
		<>
			<SelectControl
				__next40pxDefaultSize
				label={ labelComponent }
				options={ sizeOptions }
				__nextHasNoMarginBottom
			/>
			<p id={ device.id }>
				{ device.label } is used here for testing purposes to ensure we
				have access to details about the device.
			</p>
		</>
	);
};

function getDefaultControlGroup( container ) {
	// TODO: Use a user-facing query to fetch this.
	return container.querySelector(
		'.block-editor-responsive-block-control__group:not(.is-responsive)'
	);
}

function getResponsiveControlGroup( container ) {
	// TODO: Use a user-facing query to fetch this.
	return container.querySelector(
		'.block-editor-responsive-block-control__group.is-responsive'
	);
}

describe( 'Basic rendering', () => {
	it( 'should render with required props', () => {
		const { container } = render(
			<ResponsiveBlockControl
				title="Padding"
				property="padding"
				renderDefaultControl={ renderTestDefaultControlComponent }
			/>
		);

		const activePropertyLabel = screen.getByRole( 'group', {
			name: 'Padding',
		} );

		const defaultControl = screen.getByRole( 'combobox', {
			name: 'All Controls the padding property for All viewports.',
		} );

		const toggleState = screen.getByRole( 'checkbox', {
			name: 'Use the same padding on all screen sizes.',
			checked: true,
		} );

		const defaultControlGroup = getDefaultControlGroup( container );
		const responsiveControlGroup = getResponsiveControlGroup( container );

		expect( container ).not.toBeEmptyDOMElement();

		expect( defaultControlGroup ).not.toBeNull();
		expect( responsiveControlGroup ).toBeNull();

		expect( activePropertyLabel ).toBeVisible();
		expect( defaultControl ).toBeVisible();
		expect( toggleState ).toBeVisible();
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
		render(
			<ResponsiveBlockControl
				title="Padding"
				property="padding"
				renderDefaultControl={ renderTestDefaultControlComponent }
				toggleLabel={ customToggleLabel }
			/>
		);

		expect(
			screen.getByRole( 'checkbox', {
				name: customToggleLabel,
				checked: true,
			} )
		).toBeVisible();
	} );

	it( 'should pass custom label for default control group to the renderDefaultControl function when provided', () => {
		const customDefaultControlGroupLabel = {
			id: 'everything',
			label: 'Everything',
		};

		render(
			<ResponsiveBlockControl
				title="Padding"
				property="padding"
				renderDefaultControl={ renderTestDefaultControlComponent }
				defaultLabel={ customDefaultControlGroupLabel }
			/>
		);

		const defaultControlLabel = screen.getByRole( 'combobox', {
			name: 'Everything Controls the padding property for Everything viewports.',
		} );

		expect( defaultControlLabel ).toBeVisible();
	} );
} );

describe( 'Default and Responsive modes', () => {
	it( 'should render in responsive mode when isResponsive prop is set to true', () => {
		const { container } = render(
			<ResponsiveBlockControl
				title="Padding"
				property="padding"
				isResponsive
				renderDefaultControl={ renderTestDefaultControlComponent }
			/>
		);

		const defaultControlGroup = getDefaultControlGroup( container );
		const responsiveControlGroup = getResponsiveControlGroup( container );

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

		render(
			<ResponsiveBlockControl
				title="Padding"
				property="padding"
				isResponsive
				renderDefaultControl={ mockRenderDefaultControl }
				viewports={ customViewportSet }
			/>
		);

		const defaultRenderControlCall = 1;

		// Get array of labels which match those in the custom viewports provided
		const responsiveViewportsLabels = [];
		customViewportSet.forEach( ( { label } ) => {
			responsiveViewportsLabels.push(
				screen.getByRole( 'combobox', {
					name: `${ label } Controls the padding property for ${ label } viewports.`,
				} )
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
		const user = userEvent.setup();
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

		let defaultControlGroup = getDefaultControlGroup( container );
		let responsiveControlGroup = getResponsiveControlGroup( container );

		// Select elements based on what the user can see.
		const toggleInput = screen.getByRole( 'checkbox', {
			name: 'Use the same padding on all screen sizes.',
			checked: true,
		} );

		// Initial mode (default)
		expect( defaultControlGroup ).not.toBeNull();
		expect( responsiveControlGroup ).toBeNull();

		// Toggle to "responsive" mode.
		await user.click( toggleInput );

		defaultControlGroup = getDefaultControlGroup( container );
		responsiveControlGroup = getResponsiveControlGroup( container );

		expect( defaultControlGroup ).toBeNull();
		expect( responsiveControlGroup ).not.toBeNull();

		// Toggle back to "default" mode.
		await user.click( toggleInput );

		defaultControlGroup = getDefaultControlGroup( container );
		responsiveControlGroup = getResponsiveControlGroup( container );

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

		render(
			<ResponsiveBlockControl
				title="Padding"
				property="padding"
				isResponsive
				renderDefaultControl={ spyRenderDefaultControl }
				renderResponsiveControls={ mockRenderResponsiveControls }
			/>
		);

		// The user should see "range" controls so we can legitimately query for them here.
		const customControls = screen.getAllByRole( 'slider', {
			name: /\w+ screens$/,
		} );

		// Also called because default control rendeer function is always called
		// (for convenience) even though it's not displayed in output.
		expect( spyRenderDefaultControl ).toHaveBeenCalledTimes( 1 );

		expect( mockRenderResponsiveControls ).toHaveBeenCalledTimes( 1 );

		expect( customControls ).toHaveLength( 3 );
	} );
} );
