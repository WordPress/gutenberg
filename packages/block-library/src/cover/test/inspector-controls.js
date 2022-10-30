/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Need to mock the InspectorControls wrapper as this requires a slot to run
// so can't be easily unit tested.
jest.mock(
	'@wordpress/block-editor/src/components/inspector-controls',
	() =>
		( { children } ) =>
			<div className="inspector-control">{ children }</div>
);
jest.mock(
	'@wordpress/components/src/tools-panel/tools-panel-item',
	() =>
		( { children, props } ) =>
			(
				<div className="tools-panel-item" { ...props }>
					{ children }
				</div>
			)
);

/**
 * Internal dependencies
 */
import CoverInspectorControls from '../edit/inspector-controls';

function setup( jsx ) {
	return {
		user: userEvent.setup( { advanceTimers: jest.advanceTimersByTime } ),
		...render( jsx ),
	};
}
const setAttributes = jest.fn();
const setOverlayColor = jest.fn();

const defaultAttributes = {
	useFeaturedImage: false,
	dimRatio: 50,
	focalPoint: undefined,
	hasParallax: false,
	isRepeated: false,
	minHeight: 300,
	minHeightUnit: 'px',
	alt: undefined,
	overlayColor: 'primary',
};
const currentSettings = {
	isVideoBackground: false,
	isImageBackground: true,
	mediaElement: undefined,
	url: undefined,
	isImgElement: true,
	overlayColor: { color: undefined, class: undefined },
};
const defaultProps = {
	attributes: defaultAttributes,
	setAttributes,
	clientId: '1234',
	setOverlayColor,
	coverRef: undefined,
	currentSettings,
};

beforeEach( () => {
	setAttributes.mockClear();
	setOverlayColor.mockClear();
} );

describe( 'Cover block controls', () => {
	describe( 'Media settings', () => {
		test( 'does not display media settings panel if url is not set', () => {
			render( <CoverInspectorControls { ...defaultProps } /> );
			expect(
				screen.queryByRole( 'button', {
					name: 'Media settings',
				} )
			).not.toBeInTheDocument();
		} );
		test( 'displays media settings panel if url is set', () => {
			render(
				<CoverInspectorControls
					{ ...defaultProps }
					currentSettings={ {
						...currentSettings,
						url: 'http://localhost/myimage.jpg',
					} }
				/>
			);
			expect(
				screen.getByRole( 'button', {
					name: 'Media settings',
				} )
			).toBeInTheDocument();
		} );
		test( 'sets hasParallax attribute to true if fixed background toggled', async () => {
			const { user } = setup(
				<CoverInspectorControls
					{ ...defaultProps }
					currentSettings={ {
						...currentSettings,
						url: 'http://localhost/myimage.jpg',
					} }
				/>
			);
			await user.click( screen.getByLabelText( 'Fixed background' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				focalPoint: undefined,
				hasParallax: true,
			} );
		} );
		test( 'sets isRepeated attribute to true if repeated background toggled', async () => {
			const { user } = setup(
				<CoverInspectorControls
					{ ...defaultProps }
					currentSettings={ {
						...currentSettings,
						url: 'http://localhost/myimage.jpg',
					} }
				/>
			);
			await user.click( screen.getByLabelText( 'Repeated background' ) );
			expect( setAttributes ).toHaveBeenCalledWith( {
				isRepeated: true,
			} );
		} );
		test( 'sets alt attribute if text entered in alt text box', async () => {
			const { user } = setup(
				<CoverInspectorControls
					{ ...defaultProps }
					currentSettings={ {
						...currentSettings,
						url: 'http://localhost/myimage.jpg',
					} }
				/>
			);
			await user.type(
				screen.getByLabelText( 'Alt text (alternative text)' ),
				'Me'
			);

			expect( setAttributes ).toHaveBeenCalledWith( {
				alt: 'Me',
			} );
		} );
		test( 'sets left focalPoint attribute when focal point values changed', async () => {
			const { user } = setup(
				<CoverInspectorControls
					{ ...defaultProps }
					currentSettings={ {
						...currentSettings,
						url: 'http://localhost/myimage.jpg',
					} }
				/>
			);
			await user.clear( screen.getByLabelText( 'Left' ) );
			await user.type( screen.getByLabelText( 'Left' ), '100' );
			expect( setAttributes ).toHaveBeenCalledWith( {
				focalPoint: { x: 1, y: 0.5 },
			} );
		} );
		test( 'sets top focalPoint attribute when focal point values changed', async () => {
			const { user } = setup(
				<CoverInspectorControls
					{ ...defaultProps }
					currentSettings={ {
						...currentSettings,
						url: 'http://localhost/myimage.jpg',
					} }
				/>
			);

			await user.clear( screen.getByLabelText( 'Top' ) );
			await user.type( screen.getByLabelText( 'Top' ), '30' );
			expect( setAttributes ).toHaveBeenCalledWith( {
				focalPoint: { x: 0.5, y: 0.3 },
			} );
		} );
		test( 'clears media attributes when clear media button clicked', async () => {
			const { user } = setup(
				<CoverInspectorControls
					{ ...defaultProps }
					currentSettings={ {
						...currentSettings,
						url: 'http://localhost/myimage.jpg',
					} }
				/>
			);
			await user.click(
				screen.getByRole( 'button', {
					name: 'Clear Media',
				} )
			);
			expect( setAttributes ).toHaveBeenCalledWith( {
				backgroundType: undefined,
				focalPoint: undefined,
				hasParallax: undefined,
				id: undefined,
				isRepeated: undefined,
				url: undefined,
				useFeaturedImage: false,
			} );
		} );
	} );
} );

describe( 'Color panel', () => {
	test( 'displays overlay color control', () => {
		render( <CoverInspectorControls { ...defaultProps } /> );
		expect( screen.getByText( 'Overlay' ) ).toBeInTheDocument();
		// It doesn't look like it is possible to test the color selector as
		// it seems to render outside this component dom tree.
	} );

	test( 'sets dimRatio attribute when number control value changed', async () => {
		const { user } = setup(
			<CoverInspectorControls { ...defaultProps } />
		);
		await user.clear(
			screen.getByRole( 'spinbutton', {
				name: 'Overlay opacity',
			} )
		);
		await user.type(
			screen.getByRole( 'spinbutton', {
				name: 'Overlay opacity',
			} ),
			'30'
		);
		expect( setAttributes ).toHaveBeenCalledWith( {
			dimRatio: 30,
		} );
	} );
	test( 'sets dimRatio attribute when range control value changed', () => {
		setup( <CoverInspectorControls { ...defaultProps } /> );

		fireEvent.change(
			screen.getByRole( 'slider', {
				name: 'Overlay opacity',
			} ),
			{ target: { value: 25 } }
		);
		expect( setAttributes ).toHaveBeenCalledWith( {
			dimRatio: 25,
		} );
	} );
} );

describe( 'Dimensions panel', () => {
	test( 'sets minHeight attribute when number control value changed', async () => {
		const { user } = setup(
			<CoverInspectorControls { ...defaultProps } />
		);
		await user.clear( screen.getByLabelText( 'Minimum height of cover' ) );
		await user.type(
			screen.getByLabelText( 'Minimum height of cover' ),
			'300'
		);
		expect( setAttributes ).toHaveBeenCalledWith( {
			minHeight: 300,
		} );
	} );
} );
