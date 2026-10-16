// @ts-expect-error The block-editor package does not expose TypeScript declarations.
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import {
	ShortcutProvider,
	store as keyboardShortcutsStore,
} from '@wordpress/keyboard-shortcuts';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore } from '../../../../store';
import EditorKeyboardShortcuts from '../../../global-keyboard-shortcuts';
import PostExcerpt from '../../';

export async function createEditorRegistry() {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	registry.register( coreStore );
	registry.register( editorStore );
	registry.register( interfaceStore );
	registry.register( keyboardShortcutsStore );
	registry.register( preferencesStore );
	registry.dispatch( coreStore ).addEntities( [
		{
			kind: 'postType',
			name: 'post',
			baseURL: '/wp/v2/posts',
			rawAttributes: [ 'title', 'excerpt', 'content' ],
		},
	] );
	const post = {
		id: 1,
		type: 'post',
		status: 'draft',
		title: { raw: 'Original title' },
		excerpt: { raw: 'Original excerpt' },
		content: { raw: '' },
	};
	registry
		.dispatch( coreStore )
		.receiveEntityRecords( 'postType', 'post', post );
	// Preloaded data must be resolved before selectors can schedule a REST request.
	registry
		.dispatch( coreStore )
		.finishResolution( 'getEntityRecord', [ 'postType', 'post', post.id ] );
	await registry
		.resolveSelect( coreStore )
		.getEntityRecord( 'postType', 'post', post.id );
	registry.dispatch( editorStore ).setupEditor( post, {} );
	registry.dispatch( editorStore ).editPost( { title: 'Edited title' } );
	await registry
		.resolveSelect( coreStore )
		.getRawEntityRecord( 'postType', 'post', post.id );
	for ( const [ name, modifier ] of [
		[ 'undo', 'primary' ],
		[ 'redo', 'primaryShift' ],
	] as const ) {
		registry.dispatch( keyboardShortcutsStore ).registerShortcut( {
			name: `core/editor/${ name }`,
			category: 'global',
			description: name,
			keyCombination: { modifier, character: 'z' },
		} );
	}
	return registry;
}

export function ExcerptEditor( {
	registry,
	updateOnBlur = false,
}: {
	registry: Awaited< ReturnType< typeof createEditorRegistry > >;
	updateOnBlur?: boolean;
} ) {
	return (
		<RegistryProvider value={ registry }>
			<ShortcutProvider>
				<EditorKeyboardShortcuts />
				<PostExcerpt updateOnBlur={ updateOnBlur } />
				<button>Outside the excerpt</button>
			</ShortcutProvider>
		</RegistryProvider>
	);
}
