/**
 * External dependencies
 */
import { render, screen, fireEvent, within } from '@testing-library/react';

// Need to mock the BlockControls wrapper as this requires a slot to run
// so can't be easily unit tested.
jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	InspectorControls: ( { children } ) => (
		<div className="bob">{ children }</div>
	),
} ) );

/**
 * Internal dependencies
 */
import CoverInspectorControls from '../edit/inspector-controls';

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
};
const currentSettings = {
	isVideoBackground: false,
	isImageBackground: true,
	mediaElement: undefined,
	url: 'http://localhost:4759/wp-content/uploads/2022/10/b1-6.png',
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
	describe( 'Focal point control', () => {
		test( 'displays focalpoint control panel', () => {
			render( <CoverInspectorControls { ...defaultProps } /> );
		} );
	} );
} );
