/**
 * External dependencies
 */
import Shallow from 'react-test-renderer/shallow';
const ShallowRenderer = new Shallow();
/**
 * Internal dependencies
 */
import MoreEdit from '../edit';

const attributes = {
	customText: '',
	noTeaser: false,
};

describe( 'core/more/edit', () => {
	beforeEach( () => {
		attributes.noTeaser = false;
	} );
	test( 'should match snapshot when noTeaser is false', () => {
		const wrapper = ShallowRenderer.render( <MoreEdit attributes={ attributes } /> );
		expect( ShallowRenderer.getRenderOutput() ).toMatchSnapshot();
	} );
	test( 'should match snapshot when noTeaser is true', () => {
		attributes.noTeaser = true;
		const wrapper = ShallowRenderer.render( <MoreEdit attributes={ attributes } /> );
		expect( ShallowRenderer.getRenderOutput() ).toMatchSnapshot();
	} );
} );
