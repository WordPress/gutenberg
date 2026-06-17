/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
import { BlockEditorProvider } from '@wordpress/block-editor';
// @ts-expect-error - No type declarations available for @wordpress/blocks
import { createBlock } from '@wordpress/blocks';
import { Spinner } from '@wordpress/components';
import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/core-data';
import { useEditorAssets, useEditorSettings } from '@wordpress/lazy-editor';

/**
 * Internal dependencies
 */
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import './style.scss';
import NavigationMenuContent from './content';

const noop = () => {};

export default function NavigationMenuEditor( {
	id,
	onAddMenuItems,
}: {
	id: number;
	onAddMenuItems: () => void;
} ) {
	const { isReady: assetsReady } = useEditorAssets();
	const { isReady: settingsReady, editorSettings } = useEditorSettings();

	const settings = useMemo( () => {
		if ( ! editorSettings ) {
			return editorSettings;
		}

		return {
			...editorSettings,
			__experimentalFetchLinkSuggestions: (
				search: string,
				searchOptions: Record< string, unknown >
			) => fetchLinkSuggestions( search, searchOptions, editorSettings ),
		};
	}, [ editorSettings ] );

	const blocks = useMemo( () => {
		if ( ! assetsReady || ! settingsReady || ! id ) {
			return [];
		}

		return [ createBlock( 'core/navigation', { ref: id } ) ];
	}, [ assetsReady, id, settingsReady ] );

	if ( ! assetsReady || ! settingsReady || ! blocks.length ) {
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
			<NavigationMenuContent
				onAddMenuItems={ onAddMenuItems }
				rootClientId={ blocks[ 0 ].clientId }
			/>
		</BlockEditorProvider>
	);
}
