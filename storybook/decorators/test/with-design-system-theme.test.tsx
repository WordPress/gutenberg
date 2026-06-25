import { render } from '@testing-library/react';
import { ThemeProvider } from '@wordpress/theme';
import type { StoryContext } from 'storybook/internal/types';
import { WithDesignSystemTheme } from '../with-design-system-theme';

jest.mock( '@wordpress/theme', () => ( {
	ThemeProvider: jest.fn( ( { children } ) => children ),
} ) );

const mockedThemeProvider = jest.mocked( ThemeProvider );

function Story() {
	return <div>Story</div>;
}

function createStoryContext(
	overrides: Partial< StoryContext > = {}
): StoryContext {
	return {
		id: 'components-button--default',
		globals: {},
		viewMode: 'story',
		...overrides,
	} as StoryContext;
}

describe( 'WithDesignSystemTheme', () => {
	beforeEach( () => {
		mockedThemeProvider.mockClear();
	} );

	it( 'uses a root ThemeProvider for Canvas stories', () => {
		render( <>{ WithDesignSystemTheme( Story, createStoryContext() ) }</> );

		expect( mockedThemeProvider.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				isRoot: true,
			} )
		);
	} );

	it( 'uses a scoped ThemeProvider for Docs story renders', () => {
		render(
			<>
				{ WithDesignSystemTheme(
					Story,
					createStoryContext( { viewMode: 'docs' } )
				) }
			</>
		);

		expect( mockedThemeProvider.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				isRoot: false,
			} )
		);
	} );
} );
