import { useMemo } from '@wordpress/element';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Spinner } from '@wordpress/components';
import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/core-data';
import { useEditorAssets } from '@wordpress/lazy-editor';
import { unlock } from '@wordpress/routes-lock-unlock';
import './style.scss';
import NavigationMenuContent from './content';

const { ExperimentalBlockEditorProvider, listViewContentPopoverKey } = unlock(
	blockEditorPrivateApis
);

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
	// editor takes from its settings. There is no block inspector here, so
	// the selected item's content controls render in a List View popover.
	// That setting is private, so it needs the experimental provider: the
	// public one strips private settings.
	const settings = useMemo(
		() => ( {
			__experimentalFetchLinkSuggestions: (
				search: string,
				searchOptions: Record< string, unknown >
			) => fetchLinkSuggestions( search, searchOptions, {} ),
			[ listViewContentPopoverKey ]: true,
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
		<ExperimentalBlockEditorProvider
			settings={ settings }
			value={ blocks }
			onChange={ noop }
			onInput={ noop }
		>
			<NavigationMenuContent rootClientId={ blocks[ 0 ].clientId } />
		</ExperimentalBlockEditorProvider>
	);
}
