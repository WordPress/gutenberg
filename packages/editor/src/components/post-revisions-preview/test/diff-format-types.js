/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	useDiffDescriptionsRef,
	DIFF_DESCRIPTION_IDS,
} from '../diff-format-types';

function TestComponent() {
	const ref = useDiffDescriptionsRef();
	return <div ref={ ref } />;
}

const EXPECTED_DESCRIPTIONS = {
	[ DIFF_DESCRIPTION_IDS.removed ]: 'Removed',
	[ DIFF_DESCRIPTION_IDS.added ]: 'Added',
	[ DIFF_DESCRIPTION_IDS.formatAdded ]: 'Format added',
	[ DIFF_DESCRIPTION_IDS.formatRemoved ]: 'Format removed',
	[ DIFF_DESCRIPTION_IDS.formatChanged ]: 'Format changed',
};

describe( 'useDiffDescriptionsRef', () => {
	it( 'renders a visually hidden description element for every inline diff format', () => {
		render( <TestComponent /> );

		for ( const [ id, text ] of Object.entries( EXPECTED_DESCRIPTIONS ) ) {
			const description = screen.getByText( text );
			expect( description ).toHaveAttribute( 'id', id );
			expect( description ).not.toBeVisible();
		}
	} );

	it( 'removes the description elements on unmount', () => {
		const { unmount } = render( <TestComponent /> );

		unmount();

		for ( const text of Object.values( EXPECTED_DESCRIPTIONS ) ) {
			expect( screen.queryByText( text ) ).not.toBeInTheDocument();
		}
	} );
} );
