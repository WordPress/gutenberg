/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PluginPostExcerptPanel from '../plugin';

describe( 'PluginPostExcerptPanel', () => {
	test( 'renders fill properly', () => {
		render(
			<SlotFillProvider>
				<PluginPostExcerptPanel className="my-plugin-post-excerpt-custom-content">
					Post Excerpt - Custom content
				</PluginPostExcerptPanel>
				<div role="tabpanel">
					<PluginPostExcerptPanel.Slot />
				</div>
			</SlotFillProvider>
		);

		expect( screen.getByRole( 'tabpanel' ) ).toHaveTextContent(
			'Post Excerpt - Custom content'
		);
		expect(
			screen.getByText( 'Post Excerpt - Custom content' )
		).toHaveClass( 'my-plugin-post-excerpt-custom-content' );
	} );
} );
