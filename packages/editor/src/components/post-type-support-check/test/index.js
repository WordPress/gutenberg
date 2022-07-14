/**
 * External dependencies
 */
import { create } from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../';

function createMockRegistry( postType ) {
	return createRegistry( {
		'core/editor': {
			selectors: {
				getEditedPostAttribute: () => 'post',
			},
			reducer: ( state = {} ) => state,
		},
		core: {
			selectors: {
				getPostType: () => postType,
			},
			reducer: ( state = {} ) => state,
		},
	} );
}

describe( 'PostTypeSupportCheck', () => {
	it( 'renders its children when post type is not known', () => {
		const registry = createMockRegistry( null );

		const tree = create(
			<RegistryProvider value={ registry }>
				<PostTypeSupportCheck supportKeys="title">
					Supported
				</PostTypeSupportCheck>
			</RegistryProvider>
		);

		expect( tree.toJSON() ).toBe( 'Supported' );
	} );

	it( 'does not render its children when post type is known and not supports', () => {
		const registry = createMockRegistry( {
			supports: {},
		} );

		const tree = create(
			<RegistryProvider value={ registry }>
				<PostTypeSupportCheck supportKeys="title">
					Supported
				</PostTypeSupportCheck>
			</RegistryProvider>
		);

		expect( tree.toJSON() ).toBe( null );
	} );

	it( 'renders its children when post type is known and supports', () => {
		const registry = createMockRegistry( {
			supports: {
				title: true,
			},
		} );

		const tree = create(
			<RegistryProvider value={ registry }>
				<PostTypeSupportCheck supportKeys="title">
					Supported
				</PostTypeSupportCheck>
			</RegistryProvider>
		);

		expect( tree.toJSON() ).toBe( 'Supported' );
	} );

	it( 'renders its children if some of keys supported', () => {
		const registry = createMockRegistry( {
			supports: {
				title: true,
			},
		} );

		const tree = create(
			<RegistryProvider value={ registry }>
				<PostTypeSupportCheck supportKeys={ [ 'title', 'thumbnail' ] }>
					Supported
				</PostTypeSupportCheck>
			</RegistryProvider>
		);

		expect( tree.toJSON() ).toBe( 'Supported' );
	} );

	it( 'does not render its children if none of keys supported', () => {
		const registry = createMockRegistry( {
			supports: {},
		} );

		const tree = create(
			<RegistryProvider value={ registry }>
				<PostTypeSupportCheck supportKeys={ [ 'title', 'thumbnail' ] }>
					Supported
				</PostTypeSupportCheck>
			</RegistryProvider>
		);

		expect( tree.toJSON() ).toBe( null );
	} );
} );
