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
import PostPendingStatusCheck from '../check';

function createMockRegistry( isCurrentPostPublished, currentPost ) {
	return createRegistry( {
		'core/editor': {
			selectors: {
				isCurrentPostPublished: () => isCurrentPostPublished,
				getCurrentPost: () => currentPost,
			},
			reducer: ( state = {} ) => state,
		},
	} );
}

describe( 'PostPendingStatusCheck', () => {
	it( 'should not render anything if the post is published', () => {
		const registry = createMockRegistry( true, null );
		const tree = create(
			<RegistryProvider value={ registry }>
				<PostPendingStatusCheck>status</PostPendingStatusCheck>
			</RegistryProvider>
		);
		expect( tree.toJSON() ).toBe( null );
	} );

	it( 'should not render anything if the post has no publish action', () => {
		const registry = createMockRegistry( false, {
			_links: {},
		} );
		const tree = create(
			<RegistryProvider value={ registry }>
				<PostPendingStatusCheck>status</PostPendingStatusCheck>
			</RegistryProvider>
		);
		expect( tree.toJSON() ).toBe( null );
	} );

	it( 'should render if the post has a publish action', () => {
		const registry = createMockRegistry( false, {
			_links: { 'wp:action-publish': 'https://' },
		} );
		const tree = create(
			<RegistryProvider value={ registry }>
				<PostPendingStatusCheck>status</PostPendingStatusCheck>
			</RegistryProvider>
		);
		expect( tree.toJSON() ).toBe( 'status' );
	} );
} );
