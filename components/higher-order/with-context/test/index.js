/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import withContext from '../';

describe( 'withContext', () => {
	it( 'should return a new component which has context', () => {
		const Component = withContext( 'value' )()( ( { value } ) => <div>{ value }</div> );
		const wrapper = mount(
			<Component />,
			{ context: { value: 'ok' } }
		);

		expect( wrapper.text() ).toBe( 'ok' );
	} );

	it( 'should allow specifying a context getter mapping', () => {
		const Component = withContext( 'settings' )(
			( settings ) => ( { remap: settings.value } )
		)(
			( { ignore, remap } ) => <div>{ ignore }{ remap }</div>
		);

		const wrapper = mount(
			<Component />,
			{ context: { settings: { ignore: 'ignore', value: 'ok' } } }
		);

		expect( wrapper.text() ).toBe( 'ok' );
	} );
} );
