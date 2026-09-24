import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import {
	initializeEditor,
	selectBlock,
} from '@wordpress/integration-tests/helpers/integration-test-editor';

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
} );
