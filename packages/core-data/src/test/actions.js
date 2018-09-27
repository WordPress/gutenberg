/**
 * Internal dependencies
 */
import { saveEntityRecord, receiveEntityRecords } from '../actions';

describe( 'saveEntityRecord', () => {
	it( 'triggers a POST request for a new record', async () => {
		const post = { title: 'new post' };
		const entities = [ { name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' } ];
		const fulfillment = saveEntityRecord( 'postType', 'post', post );
		// Trigger generator
		fulfillment.next();
		// Provide entities and trigger apiFetch
		const { value: apiFetchAction } = fulfillment.next( entities );
		expect( apiFetchAction.request ).toEqual( {
			path: '/wp/v2/posts',
			method: 'POST',
			data: post,
		} );
		// Provide response and trigger action
		const { value: received } = fulfillment.next( { ...post, id: 10 } );
		expect( received ).toEqual( receiveEntityRecords( 'postType', 'post', { ...post, id: 10 }, undefined, true ) );
	} );

	it( 'triggers a PUT request for an existing record', async () => {
		const post = { id: 10, title: 'new post' };
		const entities = [ { name: 'post', kind: 'postType', baseURL: '/wp/v2/posts' } ];
		const fulfillment = saveEntityRecord( 'postType', 'post', post );
		// Trigger generator
		fulfillment.next();
		// Provide entities and trigger apiFetch
		const { value: apiFetchAction } = fulfillment.next( entities );
		expect( apiFetchAction.request ).toEqual( {
			path: '/wp/v2/posts/10',
			method: 'PUT',
			data: post,
		} );
		// Provide response and trigger action
		const { value: received } = fulfillment.next( post );
		expect( received ).toEqual( receiveEntityRecords( 'postType', 'post', post, undefined, true ) );
	} );
} );
