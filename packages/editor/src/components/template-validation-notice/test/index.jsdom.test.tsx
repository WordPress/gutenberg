import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { InlineNotices, store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import TemplateValidationNotice from '../index';

describe( 'TemplateValidationNotice', () => {
	it( 'announces the notice when the template becomes invalid', async () => {
		const registry = createRegistry();
		registry.register( blockEditorStore );
		registry.register( noticesStore );

		render(
			<RegistryProvider value={ registry }>
				<InlineNotices>
					<TemplateValidationNotice />
				</InlineNotices>
			</RegistryProvider>
		);
		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();

		await act( async () => {
			registry.dispatch( blockEditorStore ).setTemplateValidity( false );
		} );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			'The content of your post doesn’t match the template assigned to your post type.'
		);
	} );
} );
