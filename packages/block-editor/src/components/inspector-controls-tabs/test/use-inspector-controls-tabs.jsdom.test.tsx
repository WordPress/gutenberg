import { describe, expect, it, vi } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { SlotFillProvider } from '@wordpress/components';
import type { ReactNode } from 'react';
import useInspectorControlsTabs from '../use-inspector-controls-tabs';
import StylesTab from '../styles-tab';
import InspectorControlsSlot from '../../inspector-controls/slot';
import { TAB_LIST_VIEW, TAB_SETTINGS, TAB_STYLES } from '../utils';
import groups, {
	PrivateInspectorControlsAllowedBlocks,
} from '../../inspector-controls/groups';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	const original = await importOriginal();
	return {
		...original,
		useSelect: vi
			.fn( original.useSelect )
			.mockReturnValue( { tabSettings: {}, isPreviewMode: false } ),
	};
} );

// Records which groups the Styles tab renders, without rendering the panels.
vi.mock( import( '../../inspector-controls/slot' ), () => ( {
	default: vi.fn( () => null ) as unknown as typeof InspectorControlsSlot,
} ) );

describe( 'useInspectorControlsTabs', () => {
	it( 'includes Settings when Allowed blocks is the only settings control', () => {
		const { result } = renderHook(
			() =>
				useInspectorControlsTabs( 'test/container', [], false, false ),
			{
				wrapper: ( { children }: { children: ReactNode } ) => (
					<SlotFillProvider>
						<groups.list.Fill>List View</groups.list.Fill>
						<groups.layout.Fill>Layout</groups.layout.Fill>
						<PrivateInspectorControlsAllowedBlocks.Fill>
							Allowed blocks
						</PrivateInspectorControlsAllowedBlocks.Fill>
						{ children }
					</SlotFillProvider>
				),
			}
		);

		expect( result.current ).toEqual( [
			TAB_LIST_VIEW,
			TAB_SETTINGS,
			TAB_STYLES,
		] );
	} );

	it( 'includes Styles for every group that the Styles tab renders', () => {
		render(
			<StylesTab
				blockName="test/block"
				clientId="test-client-id"
				hasBlockStyles={ false }
				isSectionBlock={ false }
			/>
		);
		const renderedGroups = new Set(
			vi
				.mocked( InspectorControlsSlot )
				.mock.calls.map( ( [ props ] ) => props.group as string )
		);

		// Guards against the mock missing the slots, which would pass trivially.
		expect( renderedGroups.size ).toBeGreaterThan( 0 );

		for ( const group of renderedGroups ) {
			const { Fill } = groups[ group ];
			const { result } = renderHook(
				() =>
					useInspectorControlsTabs( 'test/block', [], false, false ),
				{
					wrapper: ( { children }: { children: ReactNode } ) => (
						<SlotFillProvider>
							<Fill>{ group }</Fill>
							{ children }
						</SlotFillProvider>
					),
				}
			);

			expect( {
				group,
				tabs: result.current.map( ( { name } ) => name ),
			} ).toEqual( { group, tabs: [ TAB_STYLES.name ] } );
		}
	} );
} );
