/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { MediaUploadCheck } from '../check.js';

describe( 'MediaUploadCheck', () => {
	it( 'renders its child if hasUploadPermissions is true', () => {
		const wrapper = shallow(
			<MediaUploadCheck hasUploadPermissions={ true }>
				<div>Child</div>
			</MediaUploadCheck>
		);

		expect( wrapper.children() ).toHaveLength( 1 );
		expect( wrapper.children().first().text() ).toBe( 'Child' );
	} );

	it( 'renders its child if hasUploadPermissions is true and a fallback is provided', () => {
		const fallback = (
			<div>Fallback</div>
		);

		const wrapper = shallow(
			<MediaUploadCheck hasUploadPermissions={ true } fallback={ fallback }>
				<div>Child</div>
			</MediaUploadCheck>
		);

		expect( wrapper.children() ).toHaveLength( 1 );
		expect( wrapper.children().first().text() ).toBe( 'Child' );
	} );

	it( 'renders the fallback if hasUploadPermissions is false and a fallback is provided', () => {
		const fallback = (
			<div>Fallback</div>
		);

		const wrapper = shallow(
			<MediaUploadCheck hasUploadPermissions={ false } fallback={ fallback }>
				<div>Child</div>
			</MediaUploadCheck>
		);

		expect( wrapper.children() ).toHaveLength( 1 );
		expect( wrapper.children().first().text() ).toBe( 'Fallback' );
	} );

	it( 'renders nothing if hasUploadPermissions is false and no fallback is provided', () => {
		const wrapper = shallow(
			<MediaUploadCheck hasUploadPermissions={ false }>
				<div>Child</div>
			</MediaUploadCheck>
		);

		expect( wrapper.children() ).toHaveLength( 0 );
	} );
} );
