import { useMemo } from '@wordpress/element';
import { BlockEditorProvider } from '@wordpress/block-editor';
import { Spinner as WCSpinner } from '@wordpress/components';
import {
	__experimentalFetchLinkSuggestions as fetchLinkSuggestions,
	useEntityBlockEditor,
} from '@wordpress/core-data';
import { useEditorAssets, useEditorSettings } from '@wordpress/lazy-editor';
import './style.scss';
import NavigationMenuContent from './content';

export default function NavigationMenuEditor( {
	id,
	isAddingItems,
	navigationMenu,
	onCloseAddMenuItems,
	onAutoMenuChange,
}: {
	id: number;
	isAddingItems: boolean;
	navigationMenu: {
		id: number;
		title?: {
			raw?: string;
			rendered?: string;
		};
		content?: {
			raw?: string;
			rendered?: string;
		};
	};
	onCloseAddMenuItems: () => void;
	onAutoMenuChange: ( isAutoMenu: boolean ) => void;
} ) {
	const { isReady: assetsReady } = useEditorAssets();
	const { isReady: settingsReady, editorSettings } = useEditorSettings();
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_navigation',
		{ id }
	) as [
		unknown[] | undefined,
		( blocks: unknown[], options?: Record< string, unknown > ) => void,
		( blocks: unknown[], options?: Record< string, unknown > ) => void,
	];

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

	if ( ! assetsReady || ! settingsReady || ! blocks ) {
		return (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				} }
			>
				<WCSpinner />
			</div>
		);
	}

	return (
		<BlockEditorProvider
			key={ id }
			settings={ settings }
			value={ blocks }
			onChange={ onChange }
			onInput={ onInput }
		>
			<NavigationMenuContent
				isAddingItems={ isAddingItems }
				navigationMenu={ navigationMenu }
				onCloseAddMenuItems={ onCloseAddMenuItems }
				onAutoMenuChange={ onAutoMenuChange }
			/>
		</BlockEditorProvider>
	);
}
