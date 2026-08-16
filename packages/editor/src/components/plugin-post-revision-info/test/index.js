import { render, screen } from '@testing-library/react';
import { SlotFillProvider } from '@wordpress/components';
import PluginPostRevisionInfo from '../';

describe( 'PluginPostRevisionInfo', () => {
	test( 'renders static children into the slot', () => {
		render(
			<SlotFillProvider>
				<PluginPostRevisionInfo className="my-plugin-post-revision-info">
					Revision info
				</PluginPostRevisionInfo>
				<PluginPostRevisionInfo.Slot />
			</SlotFillProvider>
		);

		expect( screen.getByText( 'Revision info' ) ).toBeVisible();
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
				<PluginPostRevisionInfo>
					{ ( { context: revisionContext } ) => (
						<span>Revision { revisionContext.revisionId }</span>
					) }
				</PluginPostRevisionInfo>
				<PluginPostRevisionInfo.Slot fillProps={ { context } } />
			</SlotFillProvider>
		);

		expect( screen.getByText( 'Revision 7' ) ).toBeVisible();
	} );
} );
