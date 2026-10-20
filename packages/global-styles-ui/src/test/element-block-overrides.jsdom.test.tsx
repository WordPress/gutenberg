import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navigator } from '@wordpress/components';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import ElementBlockOverrides from '../element-block-overrides';
import { getOverridingBlockTypes } from '../screen-block-list';
import { GlobalStylesContext } from '../context';

const BLOCKS = {
	'core/heading': 'Heading',
	'core/post-title': 'Title',
	'core/button': 'Button',
	'core/read-more': 'Read More',
};

function getConfig( blocks ) {
	return {
		settings: {
			typography: { lineHeight: true },
			color: { text: true },
		},
		styles: {
			typography: { fontWeight: '300' },
			elements: {
				heading: { typography: { fontWeight: '400' } },
				h2: { typography: { fontSize: '2rem' } },
				button: { color: { background: 'navy' } },
				link: { color: { text: 'red' } },
			},
			blocks,
		},
	};
}

function renderOverrides( element, blocks ) {
	const config = getConfig( blocks );
	return render(
		<GlobalStylesContext.Provider
			value={ {
				user: { styles: {}, settings: {} },
				base: config,
				merged: config,
				onChange: () => {},
			} }
		>
			<Navigator initialPath="/">
				<Navigator.Screen path="/">
					<ElementBlockOverrides element={ element } />
				</Navigator.Screen>
			</Navigator>
		</GlobalStylesContext.Provider>
	);
}

describe( 'getOverridingBlockTypes', () => {
	it( 'lists a block type that sets a property the element sets', () => {
		const config = getConfig( {
			'core/post-title': { typography: { fontWeight: '700' } },
		} );
		expect( getOverridingBlockTypes( config, 'heading' ) ).toEqual( [
			'core/post-title',
		] );
	} );

	it( 'gives the same list on every heading level', () => {
		const config = getConfig( {
			'core/post-title': { typography: { fontSize: '3rem' } },
		} );
		expect( getOverridingBlockTypes( config, 'heading' ) ).toEqual( [
			'core/post-title',
		] );
		expect( getOverridingBlockTypes( config, 'h5' ) ).toEqual( [
			'core/post-title',
		] );
	} );

	it( 'counts colour as well as typography', () => {
		const config = getConfig( {
			'core/button': { color: { background: 'green' } },
			'core/read-more': { color: { text: 'green' } },
		} );
		expect( getOverridingBlockTypes( config, 'button' ) ).toEqual( [
			'core/button',
		] );
		expect( getOverridingBlockTypes( config, 'link' ) ).toEqual( [
			'core/read-more',
		] );
	} );

	it( 'skips a property the element leaves to the root styles', () => {
		const config = getConfig( {
			'core/button': { typography: { fontWeight: '700' } },
		} );
		expect( getOverridingBlockTypes( config, 'button' ) ).toEqual( [] );
	} );

	it( 'skips state and nested element styles', () => {
		const config = getConfig( {
			'core/post-title': {
				':hover': { typography: { fontWeight: '700' } },
				elements: { link: { typography: { fontWeight: '700' } } },
			},
		} );
		expect( getOverridingBlockTypes( config, 'heading' ) ).toEqual( [] );
	} );
} );

describe( 'ElementBlockOverrides', () => {
	beforeAll( () => {
		for ( const [ name, title ] of Object.entries( BLOCKS ) ) {
			registerBlockType( name, {
				apiVersion: 3,
				title,
				category: 'text',
				supports: { typography: { lineHeight: true } },
				save: () => null,
			} );
		}
	} );

	afterAll( () => {
		Object.keys( BLOCKS ).forEach( unregisterBlockType );
	} );

	it( 'lists Post Title and omits Heading on the headings screen', () => {
		renderOverrides( 'heading', {
			'core/post-title': { typography: { fontWeight: '700' } },
		} );
		expect(
			screen.getByRole( 'heading', { name: 'Applies to' } )
		).toBeVisible();
		const item = screen.getByRole( 'button', { name: 'Title' } );
		expect( item ).toHaveAttribute( 'id', '/blocks/core%2Fpost-title' );
		expect(
			screen.queryByRole( 'button', { name: 'Heading' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders nothing on the captions screen', () => {
		renderOverrides( 'caption', {
			'core/post-title': { typography: { fontWeight: '700' } },
		} );
		expect( screen.queryByText( 'Applies to' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing when no block type overrides the element', () => {
		renderOverrides( 'heading', {} );
		expect( screen.queryByText( 'Applies to' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );
} );
