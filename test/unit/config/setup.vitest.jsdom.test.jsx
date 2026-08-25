import { render, screen } from '@testing-library/react';
import { decodeEntities } from '@wordpress/html-entities';
import { convertGifToVideo } from '@wordpress/video-conversion/worker';
import { vipsGetUltraHdrInfo, vipsResizeImage } from '@wordpress/vips/worker';
import { describe, expect, it, vi } from 'vitest';
import styles from './fixtures/setup.module.scss';
import * as wasmModule from './fixtures/module.wasm';

describe( 'Vitest repository setup', () => {
	it( 'preserves aliases, repository globals, CSS modules, and worker stubs', () => {
		render( <div className={ styles.primaryAction }>Setup content</div> );

		expect( screen.getByText( 'Setup content' ) ).toHaveClass(
			'style-primary-action'
		);
		expect( decodeEntities( '&amp;' ) ).toBe( '&' );
		// eslint-disable-next-line @wordpress/wp-global-usage -- This compatibility test verifies the test-only global.
		expect( globalThis.SCRIPT_DEBUG ).toBe( true );
		expect( window.tinyMCEPreInit.baseURL ).toBe( 'about:blank' );
		expect( vi.isMockFunction( convertGifToVideo ) ).toBe( true );
		expect( vi.isMockFunction( vipsGetUltraHdrInfo ) ).toBe( true );
		expect( vi.isMockFunction( vipsResizeImage ) ).toBe( true );
		expect( Object.keys( wasmModule ) ).toEqual( [] );
	} );

	it( 'cleans up Testing Library renders between tests', () => {
		expect( screen.queryByText( 'Setup content' ) ).not.toBeInTheDocument();
	} );
} );
