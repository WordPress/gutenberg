import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navigator } from '@wordpress/components';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import ElementBlockOverrides, {
	getOverridingBlockTypes,
} from '../element-block-overrides';
import { GlobalStylesContext } from '../context';

const BLOCKS = {
	'core/heading': 'Heading',
	'core/post-title': 'Title',
};

function getConfig( blocks ) {
	return {
		settings: { typography: { lineHeight: true } },
		styles: {
			typography: { fontWeight: '300' },
			elements: {
				heading: {
					typography: { fontWeight: '400' },
					':hover': { typography: { fontWeight: '500' } },
				},
				h2: { typography: { fontSize: '2rem' } },
			},
			blocks,
		},
	};
}

describe( 'getOverridingBlockTypes', () => {
	it.each( [ 'heading', 'h5' ] )(
		'lists a block type that sets a property a heading element sets on %s',
		( element ) => {
			const config = getConfig( {
				'core/post-title': { typography: { fontSize: '3rem' } },
			} );
			expect( getOverridingBlockTypes( config, element ) ).toEqual( [
				'core/post-title',
			] );
		}
	);

	it.each( [
		[
			'a property the element leaves to the root styles',
			{ typography: { lineHeight: '2' } },
		],
		[ 'state styles', { ':hover': { typography: { fontWeight: '700' } } } ],
	] )( 'skips %s', ( _, style ) => {
		const config = getConfig( { 'core/post-title': style } );
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

	function renderOverrides( blocks ) {
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
						<ElementBlockOverrides element="heading" />
					</Navigator.Screen>
				</Navigator>
			</GlobalStylesContext.Provider>
		);
	}

	it( 'lists Post Title and omits Heading on the headings screen', () => {
		renderOverrides( {
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

	it( 'renders nothing when no block type overrides the element', () => {
		renderOverrides( {} );
		expect( screen.queryByText( 'Applies to' ) ).not.toBeInTheDocument();
	} );
} );
