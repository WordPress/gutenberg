/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { AutosaveMonitor } from '../';

describe( 'AutosaveMonitor', () => {
	let setAutosaveTimerSpy;
	beforeEach( () => {
		jest.useFakeTimers( 'legacy' );
		setAutosaveTimerSpy = jest.spyOn(
			AutosaveMonitor.prototype,
			'setAutosaveTimer'
		);
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();

		setAutosaveTimerSpy.mockClear();
	} );

	it( 'should render nothing', () => {
		const { container } = render( <AutosaveMonitor isDirty /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should start autosave timer after being mounted', () => {
		render( <AutosaveMonitor isDirty /> );

		expect( setAutosaveTimerSpy ).toHaveBeenCalled();
	} );

	it( 'should clear the autosave timer after being unmounted', () => {
		const { rerender } = render( <AutosaveMonitor isDirty /> );

		rerender( <div /> );

		expect( clearTimeout ).toHaveBeenCalled();
	} );

	it( 'should clear and restart autosave timer when the interval changes', () => {
		const { rerender } = render( <AutosaveMonitor isDirty /> );

		rerender( <AutosaveMonitor isDirty interval={ 999 } /> );

		expect( clearTimeout ).toHaveBeenCalled();
		expect( setAutosaveTimerSpy ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should autosave when `editReference` changes', () => {
		const autosave = jest.fn();
		const { rerender } = render(
			<AutosaveMonitor isDirty isAutosaveable autosave={ autosave } />
		);

		expect( autosave ).not.toHaveBeenCalled();

		rerender(
			<AutosaveMonitor
				isDirty
				isAutosaveable
				autosave={ autosave }
				editsReference={ [] }
			/>
		);

		jest.runOnlyPendingTimers();

		expect( autosave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should autosave when `editReference` changes and the post becomes dirty', () => {
		const autosave = jest.fn();
		const { rerender } = render(
			<AutosaveMonitor isAutosaveable autosave={ autosave } />
		);

		expect( autosave ).not.toHaveBeenCalled();

		rerender(
			<AutosaveMonitor
				isDirty
				isAutosaveable
				autosave={ autosave }
				editsReference={ [] }
			/>
		);

		jest.runOnlyPendingTimers();

		expect( autosave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not autosave when `editReference` changes and the post is not dirty anymore', () => {
		const autosave = jest.fn();
		const { rerender } = render(
			<AutosaveMonitor isDirty isAutosaveable autosave={ autosave } />
		);

		expect( autosave ).not.toHaveBeenCalled();

		rerender(
			<AutosaveMonitor
				isAutosaveable
				autosave={ autosave }
				editsReference={ [] }
			/>
		);

		jest.runOnlyPendingTimers();

		expect( autosave ).not.toHaveBeenCalled();
	} );

	it( 'should not autosave when `editReference` changes and the post is not autosaving', () => {
		const autosave = jest.fn();
		const { rerender } = render(
			<AutosaveMonitor isAutosaveable autosave={ autosave } />
		);

		expect( autosave ).not.toHaveBeenCalled();

		rerender(
			<AutosaveMonitor
				isAutosaveable
				autosave={ autosave }
				isAutosaving={ false }
				editsReference={ [] }
			/>
		);

		jest.runOnlyPendingTimers();

		expect( autosave ).not.toHaveBeenCalled();
	} );

	it( 'should not autosave when `editReference` changes and the post started autosaving', () => {
		const autosave = jest.fn();
		const { rerender } = render(
			<AutosaveMonitor
				isAutosaveable
				autosave={ autosave }
				isAutosaving={ false }
			/>
		);

		expect( autosave ).not.toHaveBeenCalled();

		rerender(
			<AutosaveMonitor
				isAutosaveable
				autosave={ autosave }
				isAutosaving
				editsReference={ [] }
			/>
		);

		jest.runOnlyPendingTimers();

		expect( autosave ).not.toHaveBeenCalled();
	} );

	it( 'should schedule itself in another {interval} ms', () => {
		const { rerender } = render( <AutosaveMonitor isDirty /> );

		rerender( <AutosaveMonitor isDirty isAutosaveable interval={ 5 } /> );

		jest.runOnlyPendingTimers();

		expect( setTimeout ).toHaveBeenLastCalledWith(
			expect.any( Function ),
			5000
		);
	} );

	it( 'should schedule itself in 1000 ms if the post is not autosaveable at a time', () => {
		const { rerender } = render( <AutosaveMonitor isDirty /> );

		rerender(
			<AutosaveMonitor isDirty isAutosaveable={ false } interval={ 5 } />
		);

		jest.runOnlyPendingTimers();

		expect( setTimeout ).toHaveBeenLastCalledWith(
			expect.any( Function ),
			1000
		);
	} );
} );
