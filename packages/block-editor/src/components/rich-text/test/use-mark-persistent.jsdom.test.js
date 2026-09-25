import { createElement } from '@wordpress/element';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useMarkPersistent } from '../use-mark-persistent';
import { storeConfig } from '../../../store';
import { STORE_NAME } from '../../../store/constants';

// `text` is what the rich text record held when the component rendered;
// `liveText` is what it holds by the time layout effects run.
function Editable( { html, text, liveText = text } ) {
	useMarkPersistent( {
		html,
		value: { text, activeFormats: [] },
		getValue: () => ( { text: liveText, activeFormats: [] } ),
	} );
	return null;
}

function setup() {
	const registry = createRegistry();
	registry.registerStore( STORE_NAME, storeConfig );
	const markLastChangeAsPersistent = vi.spyOn(
		registry.dispatch( STORE_NAME ),
		'__unstableMarkLastChangeAsPersistent'
	);
	const wrapper = ( { children } ) => {
		return createElement( RegistryProvider, { value: registry }, children );
	};
	const editable = ( props ) => createElement( Editable, props );
	const view = render( editable( { html: 'a', text: 'a' } ), { wrapper } );
	return {
		markLastChangeAsPersistent,
		rerender: ( props ) => view.rerender( editable( props ) ),
	};
}

describe( 'useMarkPersistent', () => {
	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'does not end a typing run when the block mounts', () => {
		const { markLastChangeAsPersistent } = setup();
		expect( markLastChangeAsPersistent ).not.toHaveBeenCalled();
	} );

	it( 'ends the run right away when formatting changes without the text changing', () => {
		const { rerender, markLastChangeAsPersistent } = setup();
		rerender( { html: '<strong>a</strong>', text: 'a' } );
		expect( markLastChangeAsPersistent ).toHaveBeenCalledTimes( 1 );
	} );

	// When the html changes from outside, such as another container editing
	// the same entity, useRichText applies it to its record in a layout
	// effect of its own, so the record seen at render time is one change
	// behind. The hook has to judge the change by the live record.
	it( 'does not end the run when an external html change arrives before the record catches up', () => {
		vi.useFakeTimers();
		const { rerender, markLastChangeAsPersistent } = setup();
		rerender( { html: 'ab', text: 'a', liveText: 'ab' } );
		expect( markLastChangeAsPersistent ).not.toHaveBeenCalled();
		vi.advanceTimersByTime( 1000 );
		expect( markLastChangeAsPersistent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'ends the run a second after the text last changed', () => {
		vi.useFakeTimers();
		const { rerender, markLastChangeAsPersistent } = setup();
		rerender( { html: 'ab', text: 'ab' } );
		expect( markLastChangeAsPersistent ).not.toHaveBeenCalled();
		vi.advanceTimersByTime( 999 );
		expect( markLastChangeAsPersistent ).not.toHaveBeenCalled();
		vi.advanceTimersByTime( 1 );
		expect( markLastChangeAsPersistent ).toHaveBeenCalledTimes( 1 );
	} );
} );
