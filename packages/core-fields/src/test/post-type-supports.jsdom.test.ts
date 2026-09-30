import { describe, expect, it } from 'vitest';
import postTypeSupports from '../post_type_supports';

describe( 'post_type_supports', () => {
	it( 'provides the JavaScript parts of the fields that have some', () => {
		expect( Object.keys( postTypeSupports ) ).toEqual( [
			'author',
			'date',
			'discussion',
			'excerpt',
			'last_edited_date',
			'ping_status',
			'post-content-info',
			'scheduled_date',
			'sticky',
		] );
		expect( postTypeSupports.author ).toEqual( {
			getElements: expect.any( Function ),
			setValue: expect.any( Function ),
			render: expect.any( Function ),
			isVisible: expect.any( Function ),
		} );
	} );

	it( 'sets the author as a number', () => {
		expect(
			postTypeSupports.author.setValue?.( { item: {}, value: '3' } )
		).toEqual( { author: 3 } );
	} );

	it( 'shows the author field when the author can be assigned', () => {
		const { isVisible } = postTypeSupports.author;
		expect(
			isVisible?.( { _links: { 'wp:action-assign-author': [] } } )
		).toBe( true );
		expect( isVisible?.( { _links: {} } ) ).toBe( false );
		// A bulk edit form has no record, hence no links.
		expect( isVisible?.( {} ) ).toBe( true );
	} );

	it( 'exposes the ping status as a boolean', () => {
		const { getValue, setValue } = postTypeSupports.ping_status;
		expect( getValue?.( { item: { ping_status: 'open' } } ) ).toBe( true );
		expect( getValue?.( { item: { ping_status: 'closed' } } ) ).toBe(
			false
		);
		// A post without the property is open, as WordPress defaults to.
		expect( getValue?.( { item: {} } ) ).toBe( true );
		expect( setValue?.( { item: {}, value: false } ) ).toEqual( {
			ping_status: 'closed',
		} );
		expect( setValue?.( { item: {}, value: true } ) ).toEqual( {
			ping_status: 'open',
		} );
	} );

	it( 'summarizes the comment and ping statuses', () => {
		const render = postTypeSupports.discussion.render as ( props: {
			item: Record< string, string >;
		} ) => string;
		expect(
			render( { item: { comment_status: 'open', ping_status: 'open' } } )
		).toBe( 'Open' );
		expect(
			render( {
				item: { comment_status: 'open', ping_status: 'closed' },
			} )
		).toBe( 'Comments only' );
		expect(
			render( {
				item: { comment_status: 'closed', ping_status: 'open' },
			} )
		).toBe( 'Pings only' );
		expect( render( { item: {} } ) ).toBe( 'Closed' );
	} );

	it( 'shows the sticky field when the post can be made sticky', () => {
		const { isVisible } = postTypeSupports.sticky;
		expect( isVisible?.( { _links: { 'wp:action-sticky': [] } } ) ).toBe(
			true
		);
		expect( isVisible?.( { _links: {} } ) ).toBe( false );
		expect( isVisible?.( {} ) ).toBe( true );
	} );

	it( 'shows the last edited date of the posts that have one', () => {
		const { getValue, isVisible } = postTypeSupports.last_edited_date;
		const item = { modified: '2026-09-30T12:00:00' };
		expect( getValue?.( { item } ) ).toBe( '2026-09-30T12:00:00' );
		expect( isVisible?.( item ) ).toBe( true );
		expect( isVisible?.( {} ) ).toBe( false );
	} );

	it( 'edits the date of scheduled posts', () => {
		const { getValue, setValue, isVisible } =
			postTypeSupports.scheduled_date;
		const item = { date: '2026-10-01T09:00:00', status: 'future' };
		expect( getValue?.( { item } ) ).toBe( '2026-10-01T09:00:00' );
		expect( setValue?.( { item, value: '2026-10-02T09:00:00' } ) ).toEqual(
			{ date: '2026-10-02T09:00:00' }
		);
		expect( isVisible?.( item ) ).toBe( true );
		expect( isVisible?.( { status: 'publish' } ) ).toBe( false );
	} );

	it( 'shows the date to the users who can publish the post', () => {
		const { isVisible } = postTypeSupports.date;
		expect( isVisible?.( { _links: { 'wp:action-publish': [] } } ) ).toBe(
			true
		);
		expect( isVisible?.( { _links: {} } ) ).toBe( false );
	} );
} );
