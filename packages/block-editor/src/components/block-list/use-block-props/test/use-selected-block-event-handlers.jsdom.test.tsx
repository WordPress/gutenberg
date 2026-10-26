import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { useEventHandlers } from '../use-selected-block-event-handlers';
import { store as blockEditorStore } from '../../../../store';
import { unlock } from '../../../../lock-unlock';

const CLIENT_ID = 'section-client-id';

function Block() {
	const ref = useEventHandlers( { clientId: CLIENT_ID, isSelected: true } );
	return <div ref={ ref } data-block={ CLIENT_ID } data-testid="block" />;
}

function doubleClick( node: HTMLElement ) {
	const event = new MouseEvent( 'dblclick', {
		bubbles: true,
		cancelable: true,
	} );
	node.dispatchEvent( event );
	return event;
}

describe( 'useEventHandlers', () => {
	describe( 'double click', () => {
		const { getEditedContentOnlySection } = unlock(
			select( blockEditorStore )
		);
		const { editContentOnlySection, stopEditingContentOnlySection } =
			unlock( dispatch( blockEditorStore ) );

		beforeEach( () => {
			// An unsynced pattern is a section whose contents are edited in
			// place, unlike a synced pattern or a template part.
			dispatch( blockEditorStore ).resetBlocks( [
				{
					clientId: CLIENT_ID,
					name: 'core/group',
					attributes: {
						metadata: { patternName: 'theme/pattern' },
					},
					innerBlocks: [],
					isValid: true,
				},
			] );
		} );

		afterEach( () => {
			stopEditingContentOnlySection();
			dispatch( blockEditorStore ).resetBlocks( [] );
		} );

		it( 'starts editing the contents of the section', () => {
			render( <Block /> );

			const event = doubleClick( screen.getByTestId( 'block' ) );

			expect( getEditedContentOnlySection() ).toBe( CLIENT_ID );
			expect( event.defaultPrevented ).toBe( true );
		} );

		it( 'is left to the browser once the section is being edited', () => {
			editContentOnlySection( CLIENT_ID );
			render( <Block /> );

			const event = doubleClick( screen.getByTestId( 'block' ) );

			expect( getEditedContentOnlySection() ).toBe( CLIENT_ID );
			expect( event.defaultPrevented ).toBe( false );
		} );
	} );
} );
