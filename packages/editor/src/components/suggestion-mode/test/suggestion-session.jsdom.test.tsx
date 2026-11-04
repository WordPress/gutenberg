import { describe, expect, it } from 'vitest';
import { render, act } from '@testing-library/react';
import {
	SuggestionSessionProvider,
	useSuggestionSessionActions,
} from '../suggestion-session';

function capture( hook: () => any ) {
	let value: any;
	function Probe() {
		value = hook();
		return null;
	}
	render(
		<SuggestionSessionProvider>
			<Probe />
		</SuggestionSessionProvider>
	);
	return () => value;
}

describe( 'SuggestionSessionProvider', () => {
	it( 'records and clears structural captures with a rising sequence', () => {
		const get = capture( useSuggestionSessionActions );
		act( () => {
			get().recordStructuralCapture( 'a', 'core/paragraph', {
				type: 'block-move',
			} );
			get().recordStructuralCapture( 'b', 'core/paragraph', {
				type: 'block-remove',
			} );
		} );
		const captures = get().getStructuralCaptures();
		expect( captures.get( 'a' )!.op.type ).toBe( 'block-move' );
		expect( captures.get( 'b' )!.seq ).toBeGreaterThan(
			captures.get( 'a' )!.seq
		);
		act( () => get().clearStructuralCapture( 'a' ) );
		expect( get().getStructuralCaptures().has( 'a' ) ).toBe( false );
	} );

	it( 'stamps history-owned captures above earlier structural ones', () => {
		const get = capture( useSuggestionSessionActions );
		act( () => {
			get().recordStructuralCapture( 'a', 'core/paragraph', {
				type: 'block-move',
			} );
		} );
		const before = get().getLastContentCaptureSeq();
		act( () => get().noteHistoryCapture() );
		expect( get().getLastContentCaptureSeq() ).toBeGreaterThan( before );
		expect( get().getLastContentCaptureSeq() ).toBeGreaterThan(
			get().getStructuralCaptures().get( 'a' )!.seq
		);
	} );

	it( 'bypass tokens are consumed once', () => {
		const get = capture( useSuggestionSessionActions );
		act( () => get().requestInterceptorBypass( 'x' ) );
		expect( get().hasInterceptorBypass() ).toBe( true );
		expect( get().consumeInterceptorBypass( 'x' ) ).toBe( true );
		expect( get().consumeInterceptorBypass( 'x' ) ).toBe( false );
	} );

	it( 'actions keep a stable identity across renders', () => {
		const seen: any[] = [];
		function Probe() {
			seen.push( useSuggestionSessionActions() );
			return null;
		}
		const { rerender } = render(
			<SuggestionSessionProvider>
				<Probe />
			</SuggestionSessionProvider>
		);
		rerender(
			<SuggestionSessionProvider>
				<Probe />
			</SuggestionSessionProvider>
		);
		expect( seen.length ).toBeGreaterThan( 1 );
		expect( new Set( seen ).size ).toBe( 1 );
	} );
} );
