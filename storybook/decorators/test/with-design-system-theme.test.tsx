import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@wordpress/theme';
import type { DocsContainerProps } from '@storybook/addon-docs/blocks';
import type { StoryContext } from 'storybook/internal/types';
import {
	DesignSystemThemeDocsContainer,
	WithDesignSystemTheme,
} from '../with-design-system-theme';

jest.mock( '@wordpress/theme', () => ( {
	ThemeProvider: jest.fn( ( { children } ) => children ),
} ) );

jest.mock( '@storybook/addon-docs/blocks', () => ( {
	DocsContainer: ( { children }: React.PropsWithChildren ) => (
		<div data-testid="docs-container">{ children }</div>
	),
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

function createDocsContext(
	storyId = 'components-button--default'
): DocsContainerProps[ 'context' ] {
	const story = { id: storyId };

	return {
		componentStories: () => [ story ],
		getStoryContext: () => ( {
			globals: {
				dsColorTheme: 'dark',
				dsCursorControl: 'pointer',
				dsCornerRadius: 'moderate',
			},
		} ),
		channel: {
			on: jest.fn(),
			off: jest.fn(),
		},
	} as unknown as DocsContainerProps[ 'context' ];
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

	it( 'uses one root ThemeProvider for a matching Docs page', () => {
		render(
			<DesignSystemThemeDocsContainer context={ createDocsContext() }>
				Docs
			</DesignSystemThemeDocsContainer>
		);

		expect( screen.getByTestId( 'docs-container' ) ).toHaveTextContent(
			'Docs'
		);
		expect( mockedThemeProvider.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				color: { background: '#1e1e1e', primary: '#3858e9' },
				cursor: { control: 'pointer' },
				cornerRadius: 'moderate',
				isRoot: true,
			} )
		);
	} );

	it( 'does not wrap unrelated Docs pages', () => {
		render(
			<DesignSystemThemeDocsContainer
				context={ createDocsContext( 'docs-introduction--docs' ) }
			>
				Docs
			</DesignSystemThemeDocsContainer>
		);

		expect( screen.getByTestId( 'docs-container' ) ).toHaveTextContent(
			'Docs'
		);
		expect( mockedThemeProvider ).not.toHaveBeenCalled();
	} );
} );
