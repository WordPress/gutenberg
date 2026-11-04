import { describe, expect, it } from 'vitest';
import { render, act } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import {
	SuggestionOverlayProvider,
	useOverlayEntry,
	useSuggestionOverlayActions,
} from '../overlay-context';
import type { OverlayActions } from '../overlay-context';

describe( 'overlay entry subscriptions', () => {
	it( 're-blockUpdates a block only when its own entry changes', () => {
		let blockUpdates = 0;
		let actions: OverlayActions | undefined;

		function BlockA() {
			blockUpdates++;
			const entry = useOverlayEntry( 'a' );
			return <span>{ entry?.overlayAttributes?.content ?? '' }</span>;
		}

		function Capture() {
			actions = useSuggestionOverlayActions();
			return null;
		}

		const { container } = render(
			<RegistryProvider value={ createRegistry() }>
				<SuggestionOverlayProvider>
					<BlockA />
					<Capture />
				</SuggestionOverlayProvider>
			</RegistryProvider>
		);
		const initialActions = actions;
		const updatesAfterMount = blockUpdates;

		act( () => {
			actions!.captureBaseline( 'b', 'core/paragraph', { content: '' } );
			actions!.setOverlayAttributes( 'b', { content: 'other' } );
		} );
		expect( blockUpdates ).toBe( updatesAfterMount );
		expect( actions ).toBe( initialActions );
		expect( actions!.hasOverlay( 'b' ) ).toBe( true );

		act( () => {
			actions!.captureBaseline( 'a', 'core/paragraph', { content: '' } );
			actions!.setOverlayAttributes( 'a', { content: 'mine' } );
		} );
		expect( blockUpdates ).toBeGreaterThan( updatesAfterMount );
		expect( container ).toHaveTextContent( 'mine' );
	} );
} );
