import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SlotFillProvider } from '@wordpress/components';
import allowedBlocks from '../allowed-blocks';
import { BlockEditContextProvider } from '../../components/block-edit/context';
import { PrivateInspectorControlsAllowedBlocks } from '../../components/inspector-controls/groups';

// The inner control needs the data store, so it is stubbed out; the test only
// checks that the fill registers.
vi.mock(
	import( '../../components/block-allowed-blocks/allowed-blocks-control' ),
	() => ( {
		__esModule: true,
		default: () => <span>Manage allowed blocks</span>,
	} )
);

const BlockEditAllowedBlocksControl = allowedBlocks.edit;

describe( 'allowedBlocks edit', () => {
	it( 'registers its fill for a normal block', () => {
		render(
			<BlockEditContextProvider
				value={ {
					name: 'core/group',
					isSelected: true,
					clientId: 'test',
				} }
			>
				<SlotFillProvider>
					<BlockEditAllowedBlocksControl clientId="test" />
					<PrivateInspectorControlsAllowedBlocks.Slot />
				</SlotFillProvider>
			</BlockEditContextProvider>
		);

		expect(
			screen.getByText( 'Manage allowed blocks' )
		).toBeInTheDocument();
	} );

	it( 'opts out of rendering during pattern editing', () => {
		// The control fills its own private slot, bypassing the
		// InspectorControlsFill gate that hides the other controls from
		// section (pattern) blocks. createBlockEditFilter reads this flag to
		// keep it from rendering there.
		expect( allowedBlocks.supportsPatternEditing ).toBe( false );
	} );
} );
