import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch, useSelect } from '@wordpress/data';
import type { ReactNode } from 'react';
import StyleChangesIndicator from '../style-changes-indicator';
import { globalStylesDataKey } from '../../../../store/private-keys';

// @ts-expect-error The stub provides only what the indicator and its imports need.
vi.mock( import( '@wordpress/data' ), () => ( {
	useSelect: vi.fn(),
	useDispatch: vi.fn( () => ( {} ) ),
	useRegistry: vi.fn( () => ( {} ) ),
	createSelector: vi.fn( ( callback ) => callback ),
	createReduxStore: vi.fn(),
	createRegistry: vi.fn(),
	register: vi.fn(),
	select: vi.fn(),
	dispatch: vi.fn(),
	combineReducers: vi.fn( ( reducers ) => reducers ),
	subscribe: vi.fn(),
	RegistryProvider: ( { children }: { children: ReactNode } ) => children,
	RegistryConsumer: ( {
		children,
	}: {
		children: ( registry: object ) => ReactNode;
	} ) => children( {} ),
	AsyncModeProvider: ( { children }: { children: ReactNode } ) => children,
	useRegistrySelect: vi.fn(),
	useRegistryDispatch: vi.fn( () => ( {} ) ),
	withSelect:
		( mapStateToProps?: ( select: () => object ) => object ) =>
		( Component: ( props: object ) => unknown ) =>
		( props: object ) =>
			Component( {
				...props,
				...( mapStateToProps?.( () => ( {} ) ) || {} ),
			} ),
	withDispatch:
		() =>
		( Component: ( props: object ) => unknown ) =>
		( props: object ) =>
			Component( props ),
	withRegistry: ( Component: unknown ) => Component,
} ) );

// @ts-expect-error The stub provides only the store descriptor.
vi.mock( import( '../../../../store' ), () => ( {
	store: { name: 'core/block-editor' },
} ) );

const PARAGRAPH_SUPPORTS: Record< string, unknown > = {
	color: { text: true, background: true },
	typography: { fontSize: true },
};

// @ts-expect-error The stub provides only what the rows hook needs.
vi.mock( import( '@wordpress/blocks' ), () => ( {
	store: { name: 'core/blocks' },
	getBlockType: () => ( { title: 'Paragraph' } ),
	getBlockSupport: ( blockName: string, feature: string | string[] ) =>
		feature
			.toString()
			.split( /[.,]/ )
			.reduce< unknown >(
				( value, key ) =>
					( value as Record< string, unknown > | undefined )?.[ key ],
				PARAGRAPH_SUPPORTS
			),
	__EXPERIMENTAL_STYLE_PROPERTY: {
		color: { value: [ 'color', 'text' ], support: [ 'color', 'text' ] },
		backgroundColor: {
			value: [ 'color', 'background' ],
			support: [ 'color', 'background' ],
		},
		fontSize: {
			value: [ 'typography', 'fontSize' ],
			support: [ 'typography', 'fontSize' ],
		},
	},
} ) );

vi.mock( import( '../../../../hooks/block-style-variation' ), () => ( {
	getVariationNameFromClass: () => null,
} ) );

// The mocked hooks return what each test sets up.
const mockedUseSelect = useSelect as unknown as Mock<
	( mapSelect: ( select: unknown ) => unknown ) => unknown
>;
const mockedUseDispatch = useDispatch as unknown as Mock<
	() => Record< string, unknown >
>;

const GLOBAL_STYLES = {
	typography: { fontSize: '18px' },
	blocks: { 'core/paragraph': { color: { text: '#111' } } },
};

function mockStores( {
	attributes = {},
	isBlockBasedTheme = true,
	globalStyles = GLOBAL_STYLES,
}: {
	attributes?: Record< string, unknown >;
	isBlockBasedTheme?: boolean;
	globalStyles?: Record< string, unknown >;
} = {} ) {
	mockedUseSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => ( {
			getBlockName: () => 'core/paragraph',
			getBlockAttributes: () => attributes,
			getBlockStyles: () => [],
			getSettings: () => ( {
				__unstableIsBlockBasedTheme: isBlockBasedTheme,
				[ globalStylesDataKey ]: globalStyles,
			} ),
		} ) )
	);
}

const LOCAL_ATTRIBUTES = {
	style: { color: { text: '#c0f', background: '#fff' } },
};

const rowText = () =>
	screen.getAllByRole( 'listitem' ).map( ( item ) => item.textContent );

describe( 'StyleChangesIndicator', () => {
	const updateBlockAttributes = vi.fn();

	beforeEach( () => {
		mockedUseSelect.mockReset();
		updateBlockAttributes.mockReset();
		mockedUseDispatch.mockReturnValue( { updateBlockAttributes } );
	} );

	test( 'renders nothing for a classic theme', () => {
		mockStores( {
			attributes: LOCAL_ATTRIBUTES,
			isBlockBasedTheme: false,
		} );
		const { container } = render( <StyleChangesIndicator clientId="a" /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'lists only inherited styles when the block sets none', async () => {
		const user = userEvent.setup();
		mockStores();
		render( <StyleChangesIndicator clientId="a" /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Style origins' } )
		);

		expect(
			screen.queryByRole( 'heading', { name: 'On this block' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { name: 'Inherited' } )
		).toBeInTheDocument();
		expect( rowText() ).toEqual( [
			'Text colorParagraph block',
			'Font sizeSite typography',
		] );
		expect(
			screen.queryByRole( 'button', { name: /Reset/ } )
		).not.toBeInTheDocument();
	} );

	test( 'lists styles set on the block with a reset each', async () => {
		const user = userEvent.setup();
		mockStores( { attributes: LOCAL_ATTRIBUTES } );
		render( <StyleChangesIndicator clientId="a" /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Style origins' } )
		);

		expect(
			screen.getByRole( 'heading', { name: 'On this block' } )
		).toBeInTheDocument();
		expect( rowText() ).toEqual( [
			'Text colorReset',
			'Background colorReset',
			'Font sizeSite typography',
		] );

		await user.click(
			screen.getByRole( 'button', { name: 'Reset Text color' } )
		);
		expect( updateBlockAttributes ).toHaveBeenCalledWith( 'a', {
			style: { color: { background: '#fff' } },
		} );
	} );

	test( 'resets every style set on the block', async () => {
		const user = userEvent.setup();
		mockStores( { attributes: LOCAL_ATTRIBUTES } );
		render( <StyleChangesIndicator clientId="a" /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Style origins' } )
		);
		await user.click( screen.getByRole( 'button', { name: 'Reset all' } ) );
		expect( updateBlockAttributes ).toHaveBeenCalledWith( 'a', {
			style: undefined,
		} );
	} );

	test( 'says so when the block has no styles to list', async () => {
		const user = userEvent.setup();
		mockStores( { globalStyles: {} } );
		render( <StyleChangesIndicator clientId="a" /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Style origins' } )
		);

		expect(
			screen.getByText(
				'No styles are set on or inherited by this block.'
			)
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'heading', { level: 3 } )
		).not.toBeInTheDocument();
	} );

	test( 'closes on Escape when the block only inherits styles', async () => {
		const user = userEvent.setup();
		mockStores();
		render( <StyleChangesIndicator clientId="a" /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Style origins' } )
		);
		expect(
			screen.getByRole( 'heading', { name: 'Inherited' } )
		).toBeInTheDocument();

		await user.keyboard( '{Escape}' );
		expect(
			screen.queryByRole( 'heading', { name: 'Inherited' } )
		).not.toBeInTheDocument();
	} );
} );
