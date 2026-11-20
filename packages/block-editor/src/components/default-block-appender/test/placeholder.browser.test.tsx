import { afterEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import {
	registerBlockType,
	unregisterBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import '@wordpress/components/src/button/style.scss';
import DefaultBlockAppender from '../';
import { store as blockEditorStore } from '../../../store';
import '../content.scss';

afterEach( () => unregisterBlockType( 'test/appender' ) );

describe( 'DefaultBlockAppender placeholder', () => {
	it.each( [ 'ltr', 'rtl' ] )(
		'keeps a long initial placeholder clear of the inserter in %s layouts',
		async ( dir ) => {
			const blockType = registerBlockType( 'test/appender', {
				apiVersion: 3,
				title: 'Test block',
				category: 'text',
				attributes: {},
				save: () => null,
			} );
			if ( ! blockType ) {
				throw new Error( 'Expected the test block to be registered.' );
			}
			const registry = createRegistry();
			registry.register( blocksStore );
			registry.dispatch( blocksStore ).addBlockTypes( blockType );
			registry.register( blockEditorStore );
			await registry.dispatch( blockEditorStore ).updateSettings( {
				bodyPlaceholder:
					'Type something really long to cause overlap with the block inserter.',
			} );

			await render(
				<RegistryProvider value={ registry }>
					<div
						dir={ dir }
						style={ { width: 240, fontSize: 16, lineHeight: 1.5 } }
					>
						<DefaultBlockAppender />
					</div>
				</RegistryProvider>
			);

			const prompt = screen.getByRole( 'button', {
				name: 'Add default block',
			} );
			const inserter = screen.getByRole( 'button', {
				name: 'Add block',
			} );
			expect( inserter ).toBeEnabled();
			const inserterBounds = inserter.getBoundingClientRect();
			const textRange = document.createRange();
			textRange.selectNodeContents( prompt );
			const textLines = Array.from( textRange.getClientRects() );

			expect( textLines.length ).toBeGreaterThan( 1 );
			expect( inserterBounds.width ).toBeGreaterThan( 0 );
			expect(
				textLines.some(
					( line ) =>
						line.left < inserterBounds.right &&
						line.right > inserterBounds.left &&
						line.top < inserterBounds.bottom &&
						line.bottom > inserterBounds.top
				)
			).toBe( false );
		}
	);
} );
