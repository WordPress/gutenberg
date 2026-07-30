/**
 * External dependencies
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
		vi.spyOn( select( coreStore ), 'getPostType' ).mockReturnValue( {
			labels: {
				singular_name: 'post',
			},
		} );

		vi.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			link: 'https://wordpress.local/sample-page/',
		} );
	} );

	afterEach( () => {
		vi.restoreAllMocks();
	} );

	it( 'should render the pre-publish panel if the post is not saving, published or scheduled', () => {
		const { container } = render( <PostPublishPanel /> );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the pre-publish panel if post status is scheduled but date is before now', () => {
		vi.spyOn(
			select( editorStore ),
			'isCurrentPostScheduled'
		).mockReturnValue( true );

		const { container } = render( <PostPublishPanel /> );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the spinner if the post is being saved', () => {
		vi.spyOn( select( editorStore ), 'isSavingPost' ).mockReturnValue(
			true
		);

		const { container } = render( <PostPublishPanel /> );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the post-publish panel if the post is published', () => {
		vi.spyOn(
			select( editorStore ),
			'isCurrentPostPublished'
		).mockReturnValue( true );

		const { container } = render( <PostPublishPanel /> );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the post-publish panel if the post is scheduled', () => {
		vi.spyOn(
			select( editorStore ),
			'isCurrentPostScheduled'
		).mockReturnValue( true );
		vi.spyOn(
			select( editorStore ),
			'isEditedPostBeingScheduled'
		).mockReturnValue( true );

		const { container } = render( <PostPublishPanel /> );
		expect( container ).toMatchSnapshot();
	} );
} );
