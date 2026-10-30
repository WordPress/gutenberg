import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { SlotFillProvider } from '@wordpress/components';
import type { ReactNode } from 'react';
import useInspectorControlsTabs from '../use-inspector-controls-tabs';
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
} );
