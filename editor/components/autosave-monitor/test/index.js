/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { AutosaveMonitor } from '../';

describe( 'AutosaveMonitor', () => {
	const toggleTimer = jest.fn();
	let wrapper;
	beforeEach( () => {
		toggleTimer.mockClear();
		wrapper = shallow(
			<AutosaveMonitor />,
			{ lifecycleExperimental: true }
		);

		wrapper.instance().toggleTimer = toggleTimer;
	} );

	describe( '#componentDidUpdate()', () => {
		it( 'should start autosave timer when having become dirty and saveable', () => {
			wrapper.setProps( { isDirty: true, isSaveable: true } );

			expect( toggleTimer ).toHaveBeenCalledWith( true );
		} );

		it( 'should stop autosave timer when having become dirty but not saveable', () => {
			wrapper.setProps( { isDirty: true, isSaveable: false } );

			expect( toggleTimer ).toHaveBeenCalledWith( false );
		} );

		it( 'should stop autosave timer when having become not dirty', () => {
			wrapper.setProps( { isDirty: true } );
			toggleTimer.mockClear();
			wrapper.setProps( { isDirty: false } );

			expect( toggleTimer ).toHaveBeenCalledWith( false );
		} );

		it( 'should stop autosave timer when having become not saveable', () => {
			wrapper.setProps( { isDirty: true } );
			toggleTimer.mockClear();
			wrapper.setProps( { isSaveable: false } );

			expect( toggleTimer ).toHaveBeenCalledWith( false );
		} );
	} );

	describe( '#componentWillUnmount()', () => {
		it( 'should stop autosave timer', () => {
			wrapper.unmount();

			expect( toggleTimer ).toHaveBeenCalledWith( false );
		} );
	} );

	describe( '#render()', () => {
		it( 'should render nothing', () => {
			expect( wrapper.type() ).toBe( null );
		} );
	} );
} );
