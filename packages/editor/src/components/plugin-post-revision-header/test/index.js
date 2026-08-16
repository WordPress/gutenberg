import { render, screen } from '@testing-library/react';
import { SlotFillProvider } from '@wordpress/components';
import PluginPostRevisionHeader from '../';

describe( 'PluginPostRevisionHeader', () => {
	test( 'renders static children into the slot', () => {
		render(
			<SlotFillProvider>
				<PluginPostRevisionHeader className="my-plugin-post-revision-header">
					Revision header
				</PluginPostRevisionHeader>
				<PluginPostRevisionHeader.Slot />
			</SlotFillProvider>
		);

		expect( screen.getByText( 'Revision header' ) ).toBeVisible();
	} );

	test( 'passes the selected revision context to function children', () => {
		const context = {
			revisionId: 7,
			revision: { id: 7, date: '2024-01-01T00:00:00' },
			revisionKey: 'id',
			postId: 1,
			postType: 'post',
		};

		render(
			<SlotFillProvider>
				<PluginPostRevisionHeader>
					{ ( { context: revisionContext } ) => (
						<span>Revision { revisionContext.revisionId }</span>
					) }
				</PluginPostRevisionHeader>
				<PluginPostRevisionHeader.Slot fillProps={ { context } } />
			</SlotFillProvider>
		);

		expect( screen.getByText( 'Revision 7' ) ).toBeVisible();
	} );
} );
