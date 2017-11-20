/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getDocumentTitle } from '../ui';

describe( 'ui', () => {
	describe( 'selectors', () => {
		describe( 'getDocumentTitle', () => {
			const metaBoxes = { isDirty: false, isUpdating: false };
			it( 'should return current title unedited existing post', () => {
				const state = {
					currentPost: {
						id: 123,
						title: 'The Title',
					},
					editor: {
						present: {
							edits: {},
							blocksByUid: {},
							blockOrder: [],
						},
						isDirty: false,
					},
					metaBoxes,
				};

				expect( getDocumentTitle( state ) ).toBe( 'The Title' );
			} );

			it( 'should return current title for edited existing post', () => {
				const state = {
					currentPost: {
						id: 123,
						title: 'The Title',
					},
					editor: {
						present: {
							edits: {
								title: 'Modified Title',
							},
						},
					},
					metaBoxes,
				};

				expect( getDocumentTitle( state ) ).toBe( 'Modified Title' );
			} );

			it( 'should return new post title when new post is clean', () => {
				const state = {
					currentPost: {
						id: 1,
						status: 'auto-draft',
						title: '',
					},
					editor: {
						present: {
							edits: {},
							blocksByUid: {},
							blockOrder: [],
						},
						isDirty: false,
					},
					metaBoxes,
				};

				expect( getDocumentTitle( state ) ).toBe( __( 'New post' ) );
			} );

			it( 'should return untitled title', () => {
				const state = {
					currentPost: {
						id: 123,
						status: 'draft',
						title: '',
					},
					editor: {
						present: {
							edits: {},
							blocksByUid: {},
							blockOrder: [],
						},
						isDirty: true,
					},
					metaBoxes,
				};

				expect( getDocumentTitle( state ) ).toBe( __( '(Untitled)' ) );
			} );
		} );
	} );
} );
