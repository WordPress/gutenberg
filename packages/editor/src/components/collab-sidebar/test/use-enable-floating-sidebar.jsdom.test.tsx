import { act, render } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
// @ts-expect-error No exported types
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
import { useEnableFloatingSidebar } from '../hooks';
import { FLOATING_NOTES_SIDEBAR } from '../constants';

const DOCUMENT_SIDEBAR = 'edit-post/document';

function setup( {
	activeArea,
	enabled = true,
}: {
	activeArea?: string | null;
	enabled?: boolean;
} ) {
	const registry = createRegistry();
	registry.register( preferencesStore );
	registry.register( interfaceStore );

	if ( activeArea ) {
		registry
			.dispatch( interfaceStore )
			.enableComplementaryArea( 'core', activeArea );
	} else if ( activeArea === null ) {
		/*
		 * `disableComplementaryArea` is a no-op while the preference is
		 * untouched, so the area has to be opened before it can be closed.
		 * Only then does the selector report `null` - the user hid it - which
		 * is what the hook keys off.
		 */
		registry
			.dispatch( interfaceStore )
			.enableComplementaryArea( 'core', DOCUMENT_SIDEBAR );
		registry.dispatch( interfaceStore ).disableComplementaryArea( 'core' );
	}

	function TestComponent( { isEnabled }: { isEnabled: boolean } ) {
		useEnableFloatingSidebar( isEnabled );
		return null;
	}

	const view = render(
		<RegistryProvider value={ registry }>
			<TestComponent isEnabled={ enabled } />
		</RegistryProvider>
	);

	const getActiveArea = () =>
		registry.select( interfaceStore ).getActiveComplementaryArea( 'core' );

	return { registry, view, getActiveArea };
}

/**
 * Nudges the registry so subscribers run, standing in for the constant store
 * traffic of a live editor.
 *
 * @param registry Data registry.
 */
function tickRegistry( registry: any ) {
	act( () => {
		registry.dispatch( preferencesStore ).set( 'core', 'testTick', true );
	} );
}

describe( 'useEnableFloatingSidebar', () => {
	it( 'leaves a slot that was already closed alone', () => {
		const { registry, getActiveArea } = setup( { activeArea: null } );

		expect( getActiveArea() ).toBeNull();

		tickRegistry( registry );

		// The user closed the sidebar before there was a note to float, so
		// the board must not take the vacated slot back from under them.
		expect( getActiveArea() ).toBeNull();
	} );

	it( 'takes the slot when the user closes a sidebar while notes are shown', () => {
		const { registry, getActiveArea } = setup( {
			activeArea: DOCUMENT_SIDEBAR,
		} );

		expect( getActiveArea() ).toBe( DOCUMENT_SIDEBAR );

		act( () => {
			registry
				.dispatch( interfaceStore )
				.disableComplementaryArea( 'core' );
		} );

		expect( getActiveArea() ).toBe( FLOATING_NOTES_SIDEBAR );
	} );

	it( 'resumes claiming the slot once the user opens an area themselves', () => {
		const { registry, getActiveArea } = setup( { activeArea: null } );

		tickRegistry( registry );
		expect( getActiveArea() ).toBeNull();

		// Opening any area is the user re-engaging with the slot, so the
		// board may fill it again when they next close one.
		act( () => {
			registry
				.dispatch( interfaceStore )
				.enableComplementaryArea( 'core', DOCUMENT_SIDEBAR );
		} );
		act( () => {
			registry
				.dispatch( interfaceStore )
				.disableComplementaryArea( 'core' );
		} );

		expect( getActiveArea() ).toBe( FLOATING_NOTES_SIDEBAR );
	} );

	it( 'does nothing while disabled', () => {
		const { registry, getActiveArea } = setup( {
			activeArea: DOCUMENT_SIDEBAR,
			enabled: false,
		} );

		act( () => {
			registry
				.dispatch( interfaceStore )
				.disableComplementaryArea( 'core' );
		} );

		expect( getActiveArea() ).toBeNull();
	} );

	it( 'closes the floating board when it stops being enabled', () => {
		const { registry, view, getActiveArea } = setup( {
			activeArea: DOCUMENT_SIDEBAR,
		} );

		act( () => {
			registry
				.dispatch( interfaceStore )
				.disableComplementaryArea( 'core' );
		} );
		expect( getActiveArea() ).toBe( FLOATING_NOTES_SIDEBAR );

		act( () => {
			view.unmount();
		} );

		expect( getActiveArea() ).toBeNull();
	} );
} );
