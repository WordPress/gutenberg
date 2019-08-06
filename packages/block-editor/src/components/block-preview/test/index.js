/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import { BlockPreview } from '../index';

describe( 'BlockPreviewContent', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	it( 'renders a preview with suitable default dimensions', () => {
		const wrapper = shallow( <BlockPreview
			name="core/paragraph"
		/> );

		wrapper.update();

		const previewTransform = wrapper.find( '.editor-block-preview__content' ).first().prop( 'style' ).transform;
		const previewScale = parseInt( previewTransform.match( /\d/ )[ 0 ], 10 );

		expect( previewScale ).toEqual( 1 );
	} );
} );
