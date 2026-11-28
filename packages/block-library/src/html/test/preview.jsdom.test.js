import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import HTMLEditPreview from '../preview';

describe( 'HTMLEditPreview', () => {
	it( 'adds the editor styles wrapper class to the preview document', () => {
		const registry = createRegistry();
		registry.register( blockEditorStore );
		registry
			.dispatch( blockEditorStore )
			.updateSettings( { styles: [ { css: 'body { margin: 1px; }' } ] } );

		render(
			createElement(
				RegistryProvider,
				{ value: registry },
				createElement( HTMLEditPreview, {
					content: '<h2>Hello</h2>',
					isSelected: true,
				} )
			)
		);

		const { srcdoc } = screen.getByTitle( 'Custom HTML Preview' );

		expect( srcdoc ).toMatch(
			/<html[^>]*class="[^"]*editor-styles-wrapper/
		);
		expect( srcdoc ).toMatch(
			/<body[^>]*class="[^"]*editor-styles-wrapper/
		);
	} );
} );
