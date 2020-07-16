/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { AutosaveMonitor } from '../';

const mockThrottledSave = jest.fn();
const mockCancelSave = jest.fn();
jest.mock( '../use-throttled-autosave', () => {
	return () => [ () => mockThrottledSave(), () => mockCancelSave() ];
} );

describe( 'AutosaveMonitor', () => {
	beforeEach( () => {
		mockThrottledSave.mockClear();
		mockCancelSave.mockClear();
	} );

	it( 'should schedule an autosave when dirty and saveable on initial render', () => {
		render( <AutosaveMonitor isDirty={ true } isAutosaveable={ true } /> );
		expect( mockCancelSave ).toHaveBeenCalledTimes( 0 );
		expect( mockThrottledSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should schedule autosave when having become dirty and saveable', async () => {
		render( <AutosaveMonitor isDirty={ true } isAutosaveable={ true } /> );
		expect( mockThrottledSave ).toHaveBeenCalledTimes( 1 );
		expect( mockCancelSave ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should stop autosave timer when the autosave is up to date', () => {
		render( <AutosaveMonitor isDirty={ false } isAutosaveable={ true } /> );

		expect( mockThrottledSave ).toHaveBeenCalledTimes( 0 );
		expect( mockCancelSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should stop autosave timer when having become dirty but not autosaveable', () => {
		render( <AutosaveMonitor isDirty={ true } isAutosaveable={ false } /> );

		expect( mockThrottledSave ).toHaveBeenCalledTimes( 0 );
		expect( mockCancelSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should stop autosave timer when having become not dirty', () => {
		const { rerender } = render(
			<AutosaveMonitor isDirty={ true } isAutosaveable={ true } />
		);
		rerender(
			<AutosaveMonitor isDirty={ false } isAutosaveable={ true } />
		);

		expect( mockCancelSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should stop autosave timer when having become not autosaveable', () => {
		const { rerender } = render(
			<AutosaveMonitor isDirty={ true } isAutosaveable={ true } />
		);
		rerender(
			<AutosaveMonitor isDirty={ true } isAutosaveable={ false } />
		);

		expect( mockCancelSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should delay scheduling another autosave until after the one currently running finishes', () => {
		const { rerender } = render(
			<AutosaveMonitor
				isDirty={ true }
				isAutosaveable={ true }
				isAutosaving={ true }
			/>
		);
		expect( mockThrottledSave ).toHaveBeenCalledTimes( 0 );
		expect( mockCancelSave ).toHaveBeenCalledTimes( 0 );

		rerender(
			<AutosaveMonitor
				isDirty={ true }
				isAutosaveable={ true }
				isAutosaving={ false }
			/>
		);
		expect( mockThrottledSave ).toHaveBeenCalledTimes( 1 );
		expect( mockCancelSave ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should not schedule another autosave if the one currently running finishes and the post is not dirty anymore', () => {
		const { rerender } = render(
			<AutosaveMonitor
				isDirty={ true }
				isAutosaveable={ true }
				isAutosaving={ true }
			/>
		);
		expect( mockThrottledSave ).toHaveBeenCalledTimes( 0 );

		rerender(
			<AutosaveMonitor
				isDirty={ false }
				isAutosaveable={ true }
				isAutosaving={ false }
			/>
		);
		expect( mockThrottledSave ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should render nothing', () => {
		const { container } = render( <AutosaveMonitor /> );
		expect( container.childElementCount ).toBe( 0 );
	} );
} );
