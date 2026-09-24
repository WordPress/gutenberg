import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import {
	initializeEditor,
	selectBlock,
} from '@wordpress/integration-tests/helpers/integration-test-editor';
import { registerCoreBlocks } from '@wordpress/block-library';

describe( 'Post Excerpt block', () => {
	test( 'shows the settings when there is no post to display', async () => {
		await initializeEditor( { name: 'core/post-excerpt' } );

		await selectBlock( 'Block: Excerpt' );

		expect(
			screen.getByText( 'This block will display the excerpt.' )
		).toBeVisible();
		expect(
			screen.getByRole( 'checkbox', { name: 'Show link on new line' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'spinbutton', { name: 'Max number of words' } )
		).toBeVisible();
	} );

	test( 'shows the settings next to the protected content warning', async () => {
		// A password protected post the user cannot edit.
		const { addEntities, receiveEntityRecords, receiveUserPermission } =
			dispatch( coreStore );
		addEntities( [
			{ kind: 'postType', name: 'post', baseURL: '/wp/v2/posts' },
		] );
		receiveEntityRecords( 'postType', 'post', [
			{ id: 1, excerpt: { raw: '', rendered: '', protected: true } },
		] );
		receiveUserPermission( 'update/postType/post/1', false );

		registerCoreBlocks();
		registerBlockType( 'test/post-context', {
			apiVersion: 3,
			title: 'Post context',
			category: 'text',
			attributes: {
				postId: { type: 'number' },
				postType: { type: 'string' },
			},
			providesContext: { postId: 'postId', postType: 'postType' },
			edit: function Edit() {
				return createElement(
					'div',
					useInnerBlocksProps( useBlockProps() )
				);
			},
			save: () => null,
		} );
		await initializeEditor(
			{
				name: 'test/post-context',
				attributes: { postId: 1, postType: 'post' },
				innerBlocks: [ createBlock( 'core/post-excerpt' ) ],
			},
			false
		);

		await selectBlock( 'Block: Excerpt' );

		expect(
			screen.getByText(
				'The content is currently protected and does not have the available excerpt.'
			)
		).toBeVisible();
		expect(
			screen.getByRole( 'checkbox', { name: 'Show link on new line' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'spinbutton', { name: 'Max number of words' } )
		).toBeVisible();
	} );
} );
