import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { select } from '@wordpress/data';
import { createElement, useEffect } from '@wordpress/element';
import ErrorBoundary from '../index';

vi.mock( import( '@wordpress/a11y' ), () => ( { speak: vi.fn() } ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	select: vi.fn( () => ( { getEditedPostContent: () => '' } ) ),
} ) );

vi.mock( import( '../../../store' ), () => ( { store: {} } ) );

function CrashingChild() {
	throw new Error( 'Kaboom' );
}

function Crashable( { shouldCrash } ) {
	if ( shouldCrash ) {
		throw new Error( 'Kaboom' );
	}
	return null;
}

describe( 'Error Boundary', () => {
	it( 'announces the error title and description without action labels', () => {
		render(
			createElement(
				ErrorBoundary,
				{ canCopyContent: true },
				createElement( CrashingChild )
			)
		);

		expect( console ).toHaveErrored();
		expect( speak ).toHaveBeenCalledExactlyOnceWith(
			'The editor has crashed. An unknown error occurred. Reload your browser to try again, or copy the error to report the problem or search.',
			'assertive'
		);
		expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
		const copyContents = screen.getByRole( 'button', {
			name: 'Copy contents',
		} );
		const copyError = screen.getByRole( 'button', { name: 'Copy error' } );
		expect( copyContents ).toBeVisible();
		expect( copyError ).toBeVisible();
	} );

	it( 'copies the post content when the crashed editor clears the current post on unmount', async () => {
		const user = userEvent.setup();
		let postContent =
			'<!-- wp:paragraph --><p>Unsaved</p><!-- /wp:paragraph -->';
		select.mockReturnValue( {
			getEditedPostContent: () => postContent,
		} );

		// Like `EditorProvider`, clears the current post when it unmounts.
		function EditorProviderStub( { children } ) {
			useEffect(
				() => () => {
					postContent = '';
				},
				[]
			);
			return children;
		}

		function renderEditor( shouldCrash ) {
			return createElement(
				ErrorBoundary,
				{ canCopyContent: true },
				createElement(
					EditorProviderStub,
					null,
					createElement( Crashable, { shouldCrash } )
				)
			);
		}

		const { rerender } = render( renderEditor( false ) );
		rerender( renderEditor( true ) );
		expect( console ).toHaveErrored();

		const writeText = vi
			.spyOn( navigator.clipboard, 'writeText' )
			.mockResolvedValue();
		await user.click(
			screen.getByRole( 'button', { name: 'Copy contents' } )
		);

		expect( writeText ).toHaveBeenCalledExactlyOnceWith(
			'<!-- wp:paragraph --><p>Unsaved</p><!-- /wp:paragraph -->'
		);
	} );
} );
