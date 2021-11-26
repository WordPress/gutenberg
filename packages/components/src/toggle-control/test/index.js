/**
 * External dependencies
 */
import renderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import ToggleControl from '../';

describe( 'ToggleControl', () => {
	it( 'triggers change callback with numeric value', () => {
		// Mount: With shallow, cannot find input child of BaseControl.
		const onChange = jest.fn();
		const wrapper = renderer.create(
			<ToggleControl onChange={ onChange } />
		);
		wrapper.root
			.findByType( 'input' )
			.props.onChange( { target: { checked: true } } );

		expect( onChange ).toHaveBeenCalledWith( true );
	} );

	describe( 'help', () => {
		it( 'does not render input with describedby if no help prop', () => {
			// Mount: With shallow, cannot find input child of BaseControl.
			const onChange = jest.fn();
			const wrapper = renderer.create(
				<ToggleControl onChange={ onChange } />
			);

			const input = wrapper.root.findByType( 'input' );

			expect( input.props[ 'aria-describedby' ] ).toBeUndefined();
		} );

		it( 'renders input with describedby if help prop', () => {
			// Mount: With shallow, cannot find input child of BaseControl.
			const onChange = jest.fn();
			const wrapper = renderer.create(
				<ToggleControl onChange={ onChange } help={ true } />
			);

			const input = wrapper.root.findByType( 'input' );

			expect( input.props[ 'aria-describedby' ] ).toMatch(
				/^inspector-toggle-control-.*__help$/
			);
		} );
	} );
} );
