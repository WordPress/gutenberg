import { useMemo } from '@wordpress/element';
import { BlockEditorProvider } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/core-data';
import NavigationMenuContent from './content';

const noop = () => {};

/**
 * Edits a navigation menu's items as a list, outside the editor canvas.
 *
 * Needs the editor assets, including `@wordpress/block-library`, to have
 * loaded: callers that load them lazily must wait for them before rendering
 * this.
 *
 * @param props    Component props.
 * @param props.id The `wp_navigation` post to edit.
 */
export default function NavigationMenuEditor( { id }: { id: number } ) {
	const blocks = useMemo( () => {
		if ( ! id ) {
			return [];
		}

		// Locking the menu to its content gives its items the same editing
		// experience as content-only List View editing.
		return [
			createBlock( 'core/navigation', {
				ref: id,
				templateLock: 'contentOnly',
			} ),
		];
	}, [ id ] );

	// The link UI's search needs a suggestions fetcher, which the block
	// editor takes from its settings.
	const settings = useMemo(
		() => ( {
			__experimentalFetchLinkSuggestions: (
				search: string,
				searchOptions: Record< string, unknown >
			) => fetchLinkSuggestions( search, searchOptions, {} ),
		} ),
		[]
	);

	if ( ! blocks.length ) {
		return null;
	}

	return (
		<BlockEditorProvider
			settings={ settings }
			value={ blocks }
			onChange={ noop }
			onInput={ noop }
		>
			<NavigationMenuContent rootClientId={ blocks[ 0 ].clientId } />
		</BlockEditorProvider>
	);
}
