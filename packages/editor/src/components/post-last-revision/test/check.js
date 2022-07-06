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
import PostLastRevisionCheck from '../check';

function createMockRegistry(
	currentPostLastRevisionId,
	currentPostRevisionsCount
) {
	return createRegistry( {
		'core/editor': {
			selectors: {
				getCurrentPostLastRevisionId: () => currentPostLastRevisionId,
				getCurrentPostRevisionsCount: () => currentPostRevisionsCount,
				getEditedPostAttribute: () => 'post',
			},
			reducer: ( state = {} ) => state,
		},
		core: {
			selectors: {
				getPostType: () => ( { supports: { revisions: true } } ),
			},
			reducer: ( state = {} ) => state,
		},
	} );
}

describe( 'PostLastRevisionCheck', () => {
	it( 'should not render anything if the last revision ID is unknown', () => {
		const registry = createMockRegistry( undefined, 2 );

		const tree = create(
			<RegistryProvider value={ registry }>
				<PostLastRevisionCheck>Children</PostLastRevisionCheck>
			</RegistryProvider>
		);

		expect( tree.toJSON() ).toBe( null );
	} );

	it( 'should not render anything if there is only one revision', () => {
		const registry = createMockRegistry( 1, 1 );

		const tree = create(
			<RegistryProvider value={ registry }>
				<PostLastRevisionCheck>Children</PostLastRevisionCheck>
			</RegistryProvider>
		);

		expect( tree.toJSON() ).toBe( null );
	} );

	it( 'should render if there are two revisions', () => {
		const registry = createMockRegistry( 1, 2 );

		const tree = create(
			<RegistryProvider value={ registry }>
				<PostLastRevisionCheck>Children</PostLastRevisionCheck>
			</RegistryProvider>
		);

		expect( tree.toJSON() ).toBe( 'Children' );
	} );
} );
