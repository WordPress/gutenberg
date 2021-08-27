/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import GlobalStylesProvider, {
	useGlobalStylesContext,
} from '../global-styles-provider';

const settings = {
	styles: [
		{
			css: 'body {\n\tmargin: 0;\n\tpadding: 0;\n}',
			baseURL: 'http://localhost:4759/ponyfill.css',
		},
	],
	__experimentalGlobalStylesBaseStyles: {},
};

const generateCoverBlockType = ( colorSupports ) => {
	return {
		name: 'core/cover',
		supports: {
			color: colorSupports,
		},
	};
};

const FakeCmp = () => {
	const globalStylesContext = useGlobalStylesContext();
	const coverBlockSupports =
		globalStylesContext.blocks[ 'core/cover' ].supports;

	return <div supports={ coverBlockSupports }></div>;
};

const generateWrapper = () => {
	return mount(
		<GlobalStylesProvider
			baseStyles={ settings.__experimentalGlobalStylesBaseStyles }
		>
			<FakeCmp />
		</GlobalStylesProvider>
	);
};

describe( 'global styles provider', () => {
	beforeAll( () => {
		dispatch( 'core/edit-site' ).updateSettings( settings );
	} );

	describe( 'when a block enables color support', () => {
		describe( 'and disables background color support', () => {
			it( 'still enables text color support', () => {
				act( () => {
					dispatch( 'core/blocks' ).addBlockTypes(
						generateCoverBlockType( {
							link: true,
							background: false,
						} )
					);
				} );

				const wrapper = generateWrapper();
				const actual = wrapper
					.findWhere( ( ele ) => Boolean( ele.prop( 'supports' ) ) )
					.prop( 'supports' );
				expect( actual ).not.toContain( 'backgroundColor' );
				expect( actual ).toContain( 'color' );

				act( () => {
					dispatch( 'core/blocks' ).removeBlockTypes( 'core/cover' );
				} );
			} );
		} );

		describe( 'and both text color and background color support are disabled', () => {
			it( 'disables text color and background color support', () => {
				act( () => {
					dispatch( 'core/blocks' ).addBlockTypes(
						generateCoverBlockType( {
							text: false,
							background: false,
						} )
					);
				} );

				const wrapper = generateWrapper();
				const actual = wrapper
					.findWhere( ( ele ) => Boolean( ele.prop( 'supports' ) ) )
					.prop( 'supports' );
				expect( actual ).not.toContain( 'backgroundColor' );
				expect( actual ).not.toContain( 'color' );

				act( () => {
					dispatch( 'core/blocks' ).removeBlockTypes( 'core/cover' );
				} );
			} );
		} );

		describe( 'and text color and background color supports are omitted', () => {
			it( 'still enables both text color and background color supports', () => {
				act( () => {
					dispatch( 'core/blocks' ).addBlockTypes(
						generateCoverBlockType( { link: true } )
					);
				} );

				const wrapper = generateWrapper();
				const actual = wrapper
					.findWhere( ( ele ) => Boolean( ele.prop( 'supports' ) ) )
					.prop( 'supports' );
				expect( actual ).toContain( 'backgroundColor' );
				expect( actual ).toContain( 'color' );

				act( () => {
					dispatch( 'core/blocks' ).removeBlockTypes( 'core/cover' );
				} );
			} );
		} );
	} );
} );
