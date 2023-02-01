/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { PostPublishPanel } from '../index';

describe( 'PostPublishPanel', () => {
	jest.spyOn( select( coreStore ), 'getPostType' ).mockReturnValue( {
		labels: {
			singular_name: 'post',
		},
	} );

	jest.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
		link: 'https://wordpress.local/sample-page/',
	} );

	it( 'should render the pre-publish panel if the post is not saving, published or scheduled', () => {
		const { container } = render(
			<PostPublishPanel
				isPublished={ false }
				isScheduled={ false }
				isSaving={ false }
			/>
		);
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the pre-publish panel if post status is scheduled but date is before now', () => {
		const { container } = render(
			<PostPublishPanel isScheduled isBeingScheduled={ false } />
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the spinner if the post is being saved', () => {
		const { container } = render( <PostPublishPanel isSaving /> );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the post-publish panel if the post is published', () => {
		const { container } = render( <PostPublishPanel isPublished /> );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the post-publish panel if the post is scheduled', () => {
		const { container } = render(
			<PostPublishPanel isScheduled isBeingScheduled />
		);
		expect( container ).toMatchSnapshot();
	} );
} );
