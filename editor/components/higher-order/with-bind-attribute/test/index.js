/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import { BlockEditContextProvider } from '../../../block-edit/context';
import withBindAttribute from '../';

// Disable reason: Enzyme does not yet support React.createContext necessary
// for testing with BlockEditContextProvider.
//
// eslint-disable-next-line jest/no-disabled-tests
describe.skip( 'withBindAttribute', () => {
	const Input = ( { value, onChange } ) => <input value={ value } onChange={ onChange } />;
	const EnhancedInput = withBindAttribute( Input );
	const setAttributes = () => {};
	const attributes = { content: 'foo' };

	const context = { setAttributes, attributes };
	function mountWithBlockEditContext( props ) {
		return mount(
			<BlockEditContextProvider value={ context }>
				<EnhancedInput { ...props } />
			</BlockEditContextProvider>
		);
	}

	it( 'should do nothing if bindAttribute is not passed', () => {
		const wrapper = mountWithBlockEditContext( {} );

		expect( wrapper.prop( 'value' ) ).toBeUndefined();
		expect( wrapper.prop( 'onChange' ) ).toBeUndefined();
	} );

	it( 'should provide value and onChange parameters', () => {
		const wrapper = mountWithBlockEditContext( { bindAttribute: 'content' } );

		expect( wrapper.prop( 'value' ) ).toBe( 'foo' );
		expect( wrapper.prop( 'onChange' ) ).not.toBeUndefined();
	} );
} );
