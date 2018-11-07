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
			wrapper.setProps( { isDirty: true, isAutosaveable: true } );

			expect( toggleTimer ).toHaveBeenCalledWith( true );
		} );

		it( 'should restart autosave timer when edits reference changes', () => {
			const beforeReference = [];
			const afterReference = [];
			wrapper.setProps( {
				isDirty: true,
				isAutosaveable: true,
				editsReference: beforeReference,
			} );
			toggleTimer.mockClear();

			wrapper.setProps( {
				isDirty: true,
				isAutosaveable: true,
				editsReference: beforeReference,
			} );

			expect( toggleTimer ).not.toHaveBeenCalled();

			wrapper.setProps( {
				isDirty: true,
				isAutosaveable: true,
				editsReference: afterReference,
			} );

			expect( toggleTimer ).toHaveBeenCalledWith( true );
		} );

		it( 'should stop autosave timer when the autosave is up to date', () => {
			wrapper.setProps( { isDirty: true, isAutosaveable: false } );

			expect( toggleTimer ).toHaveBeenCalledWith( false );
		} );

		it( 'should stop autosave timer when having become dirty but not autosaveable', () => {
			wrapper.setProps( { isDirty: true, isAutosaveable: false } );

			expect( toggleTimer ).toHaveBeenCalledWith( false );
		} );

		it( 'should stop autosave timer when having become not dirty', () => {
			wrapper.setProps( { isDirty: true } );
			toggleTimer.mockClear();
			wrapper.setProps( { isDirty: false } );

			expect( toggleTimer ).toHaveBeenCalledWith( false );
		} );

		it( 'should stop autosave timer when having become not autosaveable', () => {
			wrapper.setProps( { isDirty: true } );
			toggleTimer.mockClear();
			wrapper.setProps( { isAutosaveable: false } );

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
