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
		jest.useFakeTimers( 'legacy' );
		setAutosaveTimerSpy = jest.spyOn(
			AutosaveMonitor.prototype,
			'setAutosaveTimer'
		);
		wrapper = shallow( <AutosaveMonitor isDirty />, {
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
		it( 'should clear and restart autosave timer when the interval changes', () => {
			wrapper.setProps( { interval: 999 } );
			expect( clearTimeout ).toHaveBeenCalled();
			expect( setAutosaveTimerSpy ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should set needsAutosave=true when editReference changes', () => {
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
		it( 'should schedule itself in another {interval} ms', () => {
			wrapper.setProps( {
				isAutosaveable: true,
				interval: 5,
			} );
			expect( setAutosaveTimerSpy ).toHaveBeenCalledTimes( 2 );
			wrapper.instance().autosaveTimerHandler();
			expect( setAutosaveTimerSpy ).toHaveBeenCalledTimes( 3 );
			expect( setTimeout ).lastCalledWith( expect.any( Function ), 5000 );
		} );

		it( 'should schedule itself in 1000 ms if the post is not autosaveable at a time', () => {
			wrapper.setProps( {
				isAutosaveable: false,
				interval: 5,
			} );
			expect( setAutosaveTimerSpy ).toHaveBeenCalledTimes( 2 );
			wrapper.instance().autosaveTimerHandler();
			expect( setAutosaveTimerSpy ).toHaveBeenCalledTimes( 3 );
			expect( setTimeout ).lastCalledWith( expect.any( Function ), 1000 );
		} );

		it( 'should call autosave if needsAutosave=true', () => {
			const autosave = jest.fn();
			wrapper.setProps( {
				isAutosaveable: true,
				interval: 5,
				autosave,
			} );
			wrapper.instance().needsAutosave = true;
			expect( autosave ).toHaveBeenCalledTimes( 0 );
			wrapper.instance().autosaveTimerHandler();
			expect( autosave ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should not call autosave if needsAutosave is not true', () => {
			const autosave = jest.fn();
			wrapper.setProps( {
				isAutosaveable: true,
				interval: 5,
				autosave,
			} );
			wrapper.instance().needsAutosave = false;
			expect( autosave ).toHaveBeenCalledTimes( 0 );
			wrapper.instance().autosaveTimerHandler();
			expect( autosave ).toHaveBeenCalledTimes( 0 );
		} );
	} );

	describe( '#render()', () => {
		it( 'should render nothing', () => {
			expect( wrapper.type() ).toBe( null );
		} );
	} );
} );
