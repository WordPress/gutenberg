import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import StyleChangesIndicator from '../style-changes-indicator';
import { globalStylesDataKey } from '../../../../store/private-keys';

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
	RegistryProvider: ( { children } ) => children,
	RegistryConsumer: ( { children } ) => children( {} ),
	AsyncModeProvider: ( { children } ) => children,
	useRegistrySelect: vi.fn(),
	useRegistryDispatch: vi.fn( () => ( {} ) ),
	withSelect: ( mapStateToProps ) => ( Component ) => ( props ) =>
		Component( {
			...props,
			...( mapStateToProps?.( () => ( {} ) ) || {} ),
		} ),
	withDispatch: () => ( Component ) => ( props ) => Component( props ),
	withRegistry: ( Component ) => Component,
} ) );

vi.mock( import( '../../../../store' ), () => ( {
	store: { name: 'core/block-editor' },
} ) );

const PARAGRAPH_SUPPORTS = {
	color: { text: true, background: true },
	typography: { fontSize: true },
};

vi.mock( import( '@wordpress/blocks' ), () => ( {
	store: { name: 'core/blocks' },
	getBlockType: () => ( { title: 'Paragraph' } ),
	getBlockSupport: ( blockName, feature ) =>
		feature
			.toString()
			.split( /[.,]/ )
			.reduce( ( value, key ) => value?.[ key ], PARAGRAPH_SUPPORTS ),
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

const GLOBAL_STYLES = {
	typography: { fontSize: '18px' },
	blocks: { 'core/paragraph': { color: { text: '#111' } } },
};

function mockStores( {
	attributes = {},
	isBlockBasedTheme = true,
	globalStyles = GLOBAL_STYLES,
} = {} ) {
	useSelect.mockImplementation( ( mapSelect ) =>
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

describe( 'StyleChangesIndicator', () => {
	beforeEach( () => {
		window.__experimentalGlobalStylesInheritanceUI = true;
		useSelect.mockReset();
	} );

	afterEach( () => {
		delete window.__experimentalGlobalStylesInheritanceUI;
	} );

	test( 'renders nothing with the experiment off', () => {
		delete window.__experimentalGlobalStylesInheritanceUI;
		mockStores( { attributes: LOCAL_ATTRIBUTES } );
		const { container } = render(
			createElement( StyleChangesIndicator, { clientId: 'a' } )
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders nothing for a classic theme', () => {
		mockStores( {
			attributes: LOCAL_ATTRIBUTES,
			isBlockBasedTheme: false,
		} );
		const { container } = render(
			createElement( StyleChangesIndicator, { clientId: 'a' } )
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'keeps an empty slot when the block sets no styles', () => {
		mockStores();
		const { container } = render(
			createElement( StyleChangesIndicator, { clientId: 'a' } )
		);
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( container ).not.toBeEmptyDOMElement();
	} );

	test( 'lists local, overriding and inherited styles', async () => {
		const user = userEvent.setup();
		mockStores( { attributes: LOCAL_ATTRIBUTES } );
		render( createElement( StyleChangesIndicator, { clientId: 'a' } ) );

		const toggle = screen.getByRole( 'button', {
			name: 'Style changes',
		} );
		expect( toggle ).toHaveAccessibleDescription(
			'This block has styles set on it. Show where each of its styles comes from.'
		);
		await user.click( toggle );

		const rowText = () =>
			screen
				.getAllByRole( 'listitem' )
				.map( ( item ) => item.textContent );
		expect( rowText() ).toEqual( [
			'Text colorOverrides Paragraph block#c0f',
			'Background color#fff',
		] );

		const disclosure = screen.getByRole( 'button', {
			name: 'From Global Styles (1)',
		} );
		expect( disclosure ).toHaveAttribute( 'aria-expanded', 'false' );
		await user.click( disclosure );
		expect( disclosure ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( rowText() ).toContain( 'Font sizeTypography style18px' );
	} );
} );
