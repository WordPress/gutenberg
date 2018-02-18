/**
 * Internal dependencies
 */
import { name, settings } from '../';
import { blockEditRender } from 'blocks/test/helpers';

jest.mock( 'blocks/media-upload', () => () => '*** Mock(Media upload button) ***' );
jest.mock(
	'@wordpress/data',
	() => ( {
		withSelect() {
			return ( BlockEdit ) => ( props ) => <BlockEdit hasCallAction={ false } { ...props } />;
		},
	} ),
);
describe( 'core/cover-image', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( name, settings );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
