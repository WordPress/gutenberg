/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { AutosaveMonitor } from '../';

const mockScheduleSave = jest.fn();
const mockCancelSave = jest.fn();
jest.mock( '../use-scheduled-save', () => {
	return () => ( {
		scheduleSave: () => mockScheduleSave(),
		cancelSave: () => mockCancelSave(),
	} );
} );

describe( 'AutosaveMonitor', () => {
	beforeEach( () => {
		mockScheduleSave.mockClear();
		mockCancelSave.mockClear();
	} );

	it( 'should not schedule autosave on initial render', () => {
		render( <AutosaveMonitor /> );
		expect( mockCancelSave ).toHaveBeenCalledTimes( 0 );
		expect( mockScheduleSave ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should schedule autosave when having become dirty and saveable', async () => {
		const { rerender } = render( <AutosaveMonitor /> );
		rerender(
			<AutosaveMonitor isDirty={ true } isAutosaveable={ true } />
		);

		expect( mockScheduleSave ).toHaveBeenCalledTimes( 1 );
		expect( mockCancelSave ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should schedule autosave timer when edits reference changes', () => {
		const beforeReference = [];
		const afterReference = [];

		const { rerender } = render(
			<AutosaveMonitor
				isDirty={ true }
				isAutosaveable={ true }
				editsReference={ beforeReference }
			/>
		);

		expect( mockScheduleSave ).toHaveBeenCalledTimes( 0 );

		rerender(
			<AutosaveMonitor
				isDirty={ true }
				isAutosaveable={ true }
				editsReference={ afterReference }
			/>
		);

		expect( mockScheduleSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should stop autosave timer when the autosave is up to date', () => {
		const { rerender } = render( <AutosaveMonitor /> );
		rerender(
			<AutosaveMonitor isDirty={ false } isAutosaveable={ true } />
		);

		expect( mockScheduleSave ).toHaveBeenCalledTimes( 0 );
		expect( mockCancelSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should stop autosave timer when having become dirty but not autosaveable', () => {
		const { rerender } = render( <AutosaveMonitor /> );
		rerender(
			<AutosaveMonitor isDirty={ true } isAutosaveable={ false } />
		);

		expect( mockScheduleSave ).toHaveBeenCalledTimes( 0 );
		expect( mockCancelSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should stop autosave timer when having become not dirty', () => {
		const { rerender } = render( <AutosaveMonitor /> );
		rerender(
			<AutosaveMonitor isDirty={ true } isAutosaveable={ true } />
		);
		rerender(
			<AutosaveMonitor isDirty={ false } isAutosaveable={ true } />
		);

		expect( mockCancelSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should stop autosave timer when having become not autosaveable', () => {
		const { rerender } = render( <AutosaveMonitor /> );
		rerender(
			<AutosaveMonitor isDirty={ true } isAutosaveable={ true } />
		);
		rerender(
			<AutosaveMonitor isDirty={ true } isAutosaveable={ false } />
		);

		expect( mockCancelSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should avoid scheduling autosave if still dirty but already autosaved for edits', () => {
		const { rerender } = render( <AutosaveMonitor /> );

		// Explanation: When a published post is autosaved, it's still in a
		// dirty state since the edits are not saved to the post until the
		// user clicks "Update". To avoid recurring autosaves, ensure that
		// an edit has occurred since the last autosave had completed.

		const beforeReference = [];
		const afterReference = [];

		// A post is non-dirty while autosave is in-flight.
		rerender(
			<AutosaveMonitor
				isDirty={ false }
				isAutosaving={ true }
				isAutosaveable={ true }
				editsReference={ beforeReference }
			/>
		);
		expect( mockCancelSave ).toHaveBeenCalledTimes( 1 );
		rerender(
			<AutosaveMonitor
				isDirty={ true }
				isAutosaving={ false }
				isAutosaveable={ true }
				editsReference={ beforeReference }
			/>
		);

		expect( mockCancelSave ).toHaveBeenCalledTimes( 2 );

		// Once edit occurs after autosave, resume scheduling.
		rerender(
			<AutosaveMonitor
				isDirty={ true }
				isAutosaving={ false }
				isAutosaveable={ true }
				editsReference={ afterReference }
			/>
		);

		expect( mockScheduleSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should render nothing', () => {
		const { container } = render( <AutosaveMonitor /> );
		expect( container.childElementCount ).toBe( 0 );
	} );
} );
