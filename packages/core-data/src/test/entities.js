/**
 * Internal dependencies
 */
import {
	getMethodName,
	defaultEntities,
	getKindEntities,
	getPostTypeTitle,
	getPostTypePrePersistHandler,
} from '../entities';
import { addEntities } from '../actions';

describe( 'getMethodName', () => {
	it( 'should return the right method name for an entity with the root kind', () => {
		const methodName = getMethodName( 'root', 'postType' );

		expect( methodName ).toEqual( 'getPostType' );
	} );

	it( 'should use a different suffix', () => {
		const methodName = getMethodName( 'root', 'postType', 'set' );

		expect( methodName ).toEqual( 'setPostType' );
	} );

	it( 'should use the plural form', () => {
		const methodName = getMethodName( 'root', 'postType', 'get', true );

		expect( methodName ).toEqual( 'getPostTypes' );
	} );

	it( 'should use the given plural form', () => {
		const methodName = getMethodName( 'root', 'taxonomy', 'get', true );

		expect( methodName ).toEqual( 'getTaxonomies' );
	} );

	it( 'should include the kind in the method name', () => {
		const id = defaultEntities.length;
		defaultEntities[ id ] = { name: 'book', kind: 'postType' };
		const methodName = getMethodName( 'postType', 'book' );
		delete defaultEntities[ id ];

		expect( methodName ).toEqual( 'getPostTypeBook' );
	} );
} );

describe( 'getKindEntities', () => {
	it( 'shouldn’t do anything if the entities have already been resolved', async () => {
		const entities = [ { kind: 'postType' } ];
		const fulfillment = getKindEntities( 'postType' );
		// Start the generator
		fulfillment.next();
		// Provide the entities
		const end = fulfillment.next( entities );
		expect( end.done ).toBe( true );
	} );

	it( 'shouldn’t do anything if there no defined kind config', async () => {
		const fulfillment = getKindEntities( 'unknownKind' );
		// Start the generator
		fulfillment.next();
		// Provide no entities to continue
		const end = fulfillment.next( [] );
		expect( end.done ).toBe( true );
	} );

	it( 'should fetch and add the entities', async () => {
		const fetchedEntities = [
			{
				baseURL: '/wp/v2/posts',
				kind: 'postType',
				name: 'post',
			},
		];
		const fulfillment = getKindEntities( 'postType' );
		// Start the generator
		fulfillment.next();
		// Provide no entities to continue
		fulfillment.next( [] );
		// Fetch entities and trigger action
		const { value: action } = fulfillment.next( fetchedEntities );
		expect( action ).toEqual( addEntities( fetchedEntities ) );
		const end = fulfillment.next();
		expect( end ).toEqual( { done: true, value: fetchedEntities } );
	} );
} );

describe( 'getPostTypeTitle', () => {
	it( 'should prefer the rendered value for titles for regular post types', async () => {
		const record = {
			id: 10,
			title: {
				rendered: 'My Title',
			},
		};
		expect( getPostTypeTitle( 'post' )( record ) ).toBe( 'My Title' );
	} );

	it( "should fallback to the title if it's a string", async () => {
		const record = {
			id: 10,
			title: 'My Title',
		};
		expect( getPostTypeTitle( 'post' )( record ) ).toBe( 'My Title' );
	} );

	it( 'should fallback to the id if no title provided', async () => {
		const record = {
			id: 10,
		};
		expect( getPostTypeTitle( 'post' )( record ) ).toBe( '10' );
	} );

	it( 'should prefer the rendered value for titles for templates', async () => {
		const record = {
			slug: 'single',
			title: {
				rendered: 'My Template',
			},
		};
		expect( getPostTypeTitle( 'wp_template' )( record ) ).toBe(
			'My Template'
		);
	} );

	it( "should fallback to the title if it's a string for templates", async () => {
		const record = {
			slug: 'single',
			title: 'My Template',
		};
		expect( getPostTypeTitle( 'wp_template' )( record ) ).toBe(
			'My Template'
		);
	} );

	it( 'should fallback to the slug if no title provided', async () => {
		const record = {
			slug: 'single',
		};
		expect( getPostTypeTitle( 'wp_template' )( record ) ).toBe( 'Single' );
	} );
} );

describe( 'getPostTypePrePersistHandler', () => {
	it( 'set the status to draft and empty the title when saving auto-draft posts', () => {
		let record = {
			status: 'auto-draft',
		};
		const edits = {};
		expect(
			getPostTypePrePersistHandler( 'post' )( record, edits )
		).toEqual( {
			status: 'draft',
			title: '',
		} );

		record = {
			status: 'publish',
		};
		expect(
			getPostTypePrePersistHandler( 'post' )( record, edits )
		).toEqual( {} );

		record = {
			status: 'auto-draft',
			title: 'Auto Draft',
		};
		expect(
			getPostTypePrePersistHandler( 'post' )( record, edits )
		).toEqual( {
			status: 'draft',
			title: '',
		} );

		record = {
			status: 'publish',
			title: 'My Title',
		};
		expect(
			getPostTypePrePersistHandler( 'post' )( record, edits )
		).toEqual( {} );
	} );

	it( 'should set the status of templates to publish and fix the title', () => {
		let record = {
			status: 'auto-draft',
			slug: 'single',
		};
		const edits = {};
		expect(
			getPostTypePrePersistHandler( 'wp_template' )( record, edits )
		).toEqual( {
			status: 'publish',
			title: 'Single',
		} );

		record = {
			status: 'auto-draft',
		};
		expect(
			getPostTypePrePersistHandler( 'wp_template_part' )( record, edits )
		).toEqual( {
			status: 'publish',
			title: '',
		} );

		record = {
			status: 'auto-draft',
			slug: 'single',
			title: {
				rendered: 'My title',
			},
		};
		expect(
			getPostTypePrePersistHandler( 'wp_template' )( record, edits )
		).toEqual( {
			status: 'publish',
		} );
	} );
} );
