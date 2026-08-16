import { render, screen } from '@testing-library/react';
import { useSelect, useDispatch } from '@wordpress/data';
import { SlotFillProvider } from '@wordpress/components';
import RevisionsHeader from '../revisions-header';
import PluginPostRevisionHeader from '../../plugin-post-revision-header';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: jest.fn(),
} ) );

jest.mock( '../../../lock-unlock', () => ( {
	unlock: ( object ) => ( {
		...object,
		registerPrivateActions: jest.fn(),
		registerPrivateSelectors: jest.fn(),
	} ),
} ) );

jest.mock( '../../header/header-skeleton', () => ( { settings } ) => (
	<div data-testid="editor-header-settings">{ settings }</div>
) );
jest.mock( '../../post-preview-button', () => () => null );
jest.mock( '../revisions-slider', () => () => null );
jest.mock( '../../more-menu', () => () => null );

describe( 'RevisionsHeader', () => {
	beforeEach( () => {
		useSelect.mockImplementation( ( mapSelect ) =>
			mapSelect( () => ( {
				getCurrentRevisionId: () => 7,
				getCurrentRevision: () => ( { id: 7 } ),
				getCurrentPostId: () => 1,
				getCurrentPostType: () => 'post',
				getEntityConfig: () => ( { revisionKey: 'id' } ),
				getActiveComplementaryArea: () => null,
			} ) )
		);
		useDispatch.mockImplementation( () => ( {
			setCurrentRevisionId: jest.fn(),
			restoreRevision: jest.fn(),
			enableComplementaryArea: jest.fn(),
			disableComplementaryArea: jest.fn(),
		} ) );
	} );

	test( 'renders plugin fills in the settings cluster', () => {
		render(
			<SlotFillProvider>
				<PluginPostRevisionHeader>Header fill</PluginPostRevisionHeader>
				<RevisionsHeader showDiff={ false } onToggleDiff={ () => {} } />
			</SlotFillProvider>
		);

		expect(
			screen.getByTestId( 'editor-header-settings' )
		).toHaveTextContent( 'Header fill' );
		expect( screen.getByRole( 'button', { name: 'Exit' } ) ).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();
	} );
} );
