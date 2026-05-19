/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PostPublishPanel from '../index';

describe( 'PostPublishPanel', () => {
	beforeEach( () => {
		jest.spyOn( select( coreStore ), 'getPostType' ).mockReturnValue( {
			labels: {
				singular_name: 'post',
			},
		} );

		jest.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			link: 'https://wordpress.local/sample-page/',
		} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'should render the pre-publish panel if the post is not saving, published or scheduled', () => {
		const { container } = render( <PostPublishPanel /> );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the pre-publish panel if post status is scheduled but date is before now', () => {
		jest.spyOn(
			select( editorStore ),
			'isCurrentPostScheduled'
		).mockReturnValue( true );

		const { container } = render( <PostPublishPanel /> );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the spinner if the post is being saved', () => {
		jest.spyOn( select( editorStore ), 'isSavingPost' ).mockReturnValue(
			true
		);

		const { container } = render( <PostPublishPanel /> );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the post-publish panel if the post is published', () => {
		jest.spyOn(
			select( editorStore ),
			'isCurrentPostPublished'
		).mockReturnValue( true );

		const { container } = render( <PostPublishPanel /> );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the post-publish panel if the post is scheduled', () => {
		jest.spyOn(
			select( editorStore ),
			'isCurrentPostScheduled'
		).mockReturnValue( true );
		jest.spyOn(
			select( editorStore ),
			'isEditedPostBeingScheduled'
		).mockReturnValue( true );

		const { container } = render( <PostPublishPanel /> );
		expect( container ).toMatchSnapshot();
	} );
} );
