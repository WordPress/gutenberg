/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Need to mock the BlockControls wrapper as this requires a slot to run
// so can't be easily unit tested.
jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	InspectorControls: ( { children } ) => (
		<div className="inspector-control">{ children }</div>
	),
	ToolsPanelItem: ( { children } ) => (
		<div className="tools-panel-item">{ children }</div>
	),
} ) );

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
		test( 'sets focalPoint attribute when focal point values changed', async () => {
			const { user } = setup(
				<CoverInspectorControls
					{ ...defaultProps }
					currentSettings={ {
						...currentSettings,
						url: 'http://localhost/myimage.jpg',
					} }
				/>
			);
			await user.type( screen.getByLabelText( 'Left' ), '1' );
			expect( setAttributes ).toHaveBeenCalledWith( {
				focalPoint: { x: 1, y: 0.5 },
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
