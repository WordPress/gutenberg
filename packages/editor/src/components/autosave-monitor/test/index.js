/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { AutosaveMonitor } from '../';

describe( 'AutosaveMonitor', () => {
	let wrapper;
	let setAutosaveTimerSpy;
	beforeEach( () => {
		jest.useFakeTimers();
		setAutosaveTimerSpy = jest.spyOn(
			AutosaveMonitor.prototype,
			'setAutosaveTimer'
		);
		wrapper = shallow( <AutosaveMonitor />, {
			lifecycleExperimental: true,
		} );
	} );

	afterEach( () => {
		setAutosaveTimerSpy.mockClear();
	} );

	it( 'should start autosave timer after being mounted', () => {
		expect( setAutosaveTimerSpy ).toHaveBeenCalled();
	} );

	it( 'should clear the autosave timer after being unmounted', () => {
		wrapper.unmount();
		expect( clearTimeout ).toHaveBeenCalled();
	} );

	describe( '#componentDidUpdate()', () => {
		it( 'should set needsAutosave=true when editReference changes and other props stay the same (1)', () => {
			expect( wrapper.instance().needsAutosave ).toBe( false );
			wrapper.setProps( {
				editsReference: [],
			} );
			expect( wrapper.instance().needsAutosave ).toBe( true );
		} );

		it( 'should set needsAutosave=true when editReference changes and the post becomes dirty', () => {
			expect( wrapper.instance().needsAutosave ).toBe( false );
			wrapper.setProps( {
				isDirty: true,
				editsReference: [],
			} );
			expect( wrapper.instance().needsAutosave ).toBe( true );
		} );

		it( 'should not set needsAutosave=true when editReference changes and the post is not dirty anymore', () => {
			expect( wrapper.instance().needsAutosave ).toBe( false );
			wrapper.setProps( {
				isDirty: true,
				editsReference: [],
			} );
			wrapper.setProps( {
				isDirty: false,
				editsReference: [],
			} );
			expect( wrapper.instance().needsAutosave ).toBe( false );
		} );

		it( 'should set needsAutosave=true when editReference changes and the post is not autosaving', () => {
			expect( wrapper.instance().needsAutosave ).toBe( false );
			wrapper.setProps( {
				isAutosaving: false,
				editsReference: [],
			} );
			expect( wrapper.instance().needsAutosave ).toBe( true );
		} );

		it( 'should not set needsAutosave=true when editReference changes and the post started autosaving', () => {
			expect( wrapper.instance().needsAutosave ).toBe( false );
			wrapper.setProps( {
				isAutosaving: false,
				editsReference: [],
			} );
			wrapper.setProps( {
				isAutosaving: true,
				editsReference: [],
			} );
			expect( wrapper.instance().needsAutosave ).toBe( false );
		} );
	} );

	describe( '#autosaveTimerHandler()', () => {
		it( 'should schedule itself in another {interval} ms', () => {} );
		it( 'should schedule itself in 1000 ms if the post is not autosaveable at a time', () => {} );
		it( 'should call autosave if needsAutosave=true', () => {} );
		it( 'should not call autosave if needsAutosave is not true', () => {} );
	} );

	describe( '#render()', () => {
		it( 'should render nothing', () => {
			expect( wrapper.type() ).toBe( null );
		} );
	} );
} );
