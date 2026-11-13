import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatternsFilter } from '../patterns-filter';
import { allPatternsCategory, INSERTER_PATTERN_TYPES } from '../utils';

async function openFilter( {
	siteHasDirectoryPatterns,
	categorySources,
}: {
	siteHasDirectoryPatterns: boolean;
	categorySources: string[];
} ) {
	const user = userEvent.setup();
	render(
		<PatternsFilter
			setPatternSyncFilter={ vi.fn() }
			setPatternSourceFilter={ vi.fn() }
			setPatternAuthorFilter={ vi.fn() }
			patternSyncFilter="all"
			patternSourceFilter="all"
			patternAuthorFilter="all"
			scrollContainerRef={ { current: null } }
			category={ allPatternsCategory }
			siteHasDirectoryPatterns={ siteHasDirectoryPatterns }
			categorySources={ new Set( categorySources ) }
		/>
	);
	await user.click(
		screen.getByRole( 'button', { name: 'Filter patterns' } )
	);
}

function getSource( name: string ) {
	return within( screen.getByRole( 'group', { name: 'Source' } ) ).getByRole(
		'menuitemradio',
		{ name }
	);
}

describe( 'PatternsFilter', () => {
	it( 'enables the sources that have patterns in the category', async () => {
		await openFilter( {
			siteHasDirectoryPatterns: true,
			categorySources: Object.values( INSERTER_PATTERN_TYPES ),
		} );

		for ( const name of [
			'Pattern Directory',
			'Theme & Plugins',
			'User',
		] ) {
			expect( getSource( name ) ).not.toHaveAttribute(
				'aria-disabled',
				'true'
			);
		}
		expect(
			screen.getByRole( 'link', {
				name: /WordPress.org Pattern Directory/,
			} )
		).toBeInTheDocument();
	} );

	it( 'disables the sources that have no patterns in the category', async () => {
		await openFilter( {
			siteHasDirectoryPatterns: true,
			categorySources: [ INSERTER_PATTERN_TYPES.theme ],
		} );

		expect( getSource( 'Pattern Directory' ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( getSource( 'User' ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( getSource( 'Theme & Plugins' ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( getSource( 'All' ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect(
			screen.getByRole( 'link', {
				name: /WordPress.org Pattern Directory/,
			} )
		).toBeInTheDocument();
	} );

	it( 'hides the Pattern Directory source when there are no directory patterns', async () => {
		await openFilter( {
			siteHasDirectoryPatterns: false,
			categorySources: [
				INSERTER_PATTERN_TYPES.theme,
				INSERTER_PATTERN_TYPES.user,
			],
		} );

		expect(
			screen.queryByRole( 'menuitemradio', {
				name: 'Pattern Directory',
			} )
		).not.toBeInTheDocument();
		expect( getSource( 'Theme & Plugins' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect(
			screen.getByText(
				'Patterns are bundled in the active theme or created by users on this site. Only patterns created on this site can be synced.'
			)
		).toBeInTheDocument();
	} );
} );
