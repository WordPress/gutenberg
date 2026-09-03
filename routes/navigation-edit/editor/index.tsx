import { useMemo } from '@wordpress/element';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
import { BlockEditorProvider } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Spinner } from '@wordpress/components';
import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/core-data';
import { useEditorAssets } from '@wordpress/lazy-editor';
import './style.scss';
import NavigationMenuContent from './content';

const noop = () => {};

export default function NavigationMenuEditor( { id }: { id: number } ) {
	const { isReady: assetsReady } = useEditorAssets();

	const blocks = useMemo( () => {
		if ( ! assetsReady || ! id ) {
			return [];
		}

		return [ createBlock( 'core/navigation', { ref: id } ) ];
	}, [ assetsReady, id ] );

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

	if ( ! assetsReady || ! blocks.length ) {
		return (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				} }
			>
				<Spinner />
			</div>
		);
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
