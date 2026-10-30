import { describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { speak } from '@wordpress/a11y';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import TemplateValidationNotice from '../index';

vi.mock( import( '@wordpress/a11y' ), () => ( { speak: vi.fn() } ) );

describe( 'TemplateValidationNotice', () => {
	it( 'announces the notice when the template becomes invalid', () => {
		const registry = createRegistry();
		registry.register( blockEditorStore );

		render(
			<RegistryProvider value={ registry }>
				<TemplateValidationNotice />
			</RegistryProvider>
		);
		expect( speak ).not.toHaveBeenCalled();

		act( () => {
			registry.dispatch( blockEditorStore ).setTemplateValidity( false );
		} );

		expect( speak ).toHaveBeenCalledExactlyOnceWith(
			'The content of your post doesn’t match the template assigned to your post type.'
		);
	} );
} );
