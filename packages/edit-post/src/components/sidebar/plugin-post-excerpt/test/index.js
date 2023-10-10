/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PluginPostExcerptPanel from '../';

describe( 'PluginPostExcerptPanel', () => {
	test( 'renders fill properly', () => {
		const { container } = render(
			<SlotFillProvider>
				<PluginPostExcerptPanel className="my-plugin-post-excerpt-custom-content">
					Post Excerpt - Custom content
				</PluginPostExcerptPanel>
				<PluginPostExcerptPanel.Slot />
			</SlotFillProvider>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
