import { useNavigate, useSearch } from '@wordpress/route';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useEditorAssets, useEditorSettings } from '@wordpress/lazy-editor';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '@wordpress/routes-lock-unlock';

const { StyleBookPreview } = unlock( editorPrivateApis );

function Canvas() {
	const { isReady: assetsReady } = useEditorAssets();
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as any;
	const { globalStylesId, isBlockTheme } = useSelect( ( select ) => {
		const { getCurrentTheme, __experimentalGetCurrentGlobalStylesId } =
			select( coreStore ) as any;
		return {
			globalStylesId: __experimentalGetCurrentGlobalStylesId(),
			isBlockTheme: !! getCurrentTheme()?.is_block_theme,
		};
	}, [] );
	// The style book reads the theme's colors and typography from the editor
	// settings. It cannot fall back to the editor store here, because on this
	// route nothing mounts the editor that would populate it.
	const { isReady: settingsReady, editorSettings } = useEditorSettings( {
		stylesId: globalStylesId,
	} );

	// Get section from URL query params
	const section = ( search.section ?? '/' ) as string;

	const onChangeSection = ( updatedSection: string ) => {
		navigate( {
			search: {
				...search,
				section: updatedSection,
			},
		} );
	};

	// Settings are awaited as well as assets: an unresolved `editorSettings` is
	// still an object, so it would suppress the style book's own fallback and
	// render a first pass with no theme styles.
	if ( ! assetsReady || ! settingsReady ) {
		return (
			<div
				style={ {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100%',
				} }
			>
				<Spinner />
			</div>
		);
	}

	// On classic themes the style book is the whole route: there is no styles
	// UI for a selected section to drive, so its sections aren't clickable.
	if ( ! isBlockTheme ) {
		return <StyleBookPreview isStatic settings={ editorSettings } />;
	}

	return (
		<StyleBookPreview
			path={ section }
			onPathChange={ onChangeSection }
			settings={ editorSettings }
		/>
	);
}

export const canvas = Canvas;
