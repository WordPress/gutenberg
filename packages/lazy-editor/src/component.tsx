/**
 * WordPress dependencies
 */
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { store as coreDataStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useStylesId } from './hooks/use-styles-id';
import { useEditorSettings } from './hooks/use-editor-settings';
import { useEditorAssets } from './hooks/use-editor-assets';
import { unlock } from './lock-unlock';

const { Editor: PrivateEditor } = unlock( editorPrivateApis );

interface EditorProps {
	postType: string;
	postId: string;
	settings?: Record< string, any >;
}

/**
 * Lazy-loading editor component that handles asset loading and settings initialization.
 *
 * @param {Object} props          Component props
 * @param {string} props.postType The post type to edit
 * @param {string} props.postId   The post ID to edit
 * @param {Object} props.settings Optional extra settings to merge with editor settings
 * @return The editor component with loading states
 */
export function Editor( { postType, postId, settings }: EditorProps ) {
	// Resolve template ID from post type/ID
	const templateId = useSelect(
		( select ) => {
			if ( ! postType || ! postId ) {
				return undefined;
			}
			if ( postType === 'wp_template' ) {
				return postId;
			}
			// Use private API to get template ID for this post
			return unlock( select( coreDataStore ) ).getTemplateId(
				postType,
				postId
			);
		},
		[ postType, postId ]
	);

	// Resolve styles ID from template
	const stylesId = useStylesId( { templateId } );

	// Load editor settings and assets
	const { isReady: settingsReady, editorSettings } = useEditorSettings( {
		stylesId,
	} );
	const { isReady: assetsReady } = useEditorAssets();
	const finalSettings = useMemo(
		() => ( {
			...editorSettings,
			...settings,
		} ),
		[ editorSettings, settings ]
	);

	// Show loading spinner while assets or settings are loading
	if ( ! settingsReady || ! assetsReady ) {
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

	// Render the editor when ready
	return (
		<PrivateEditor
			postType={ postType }
			postId={ postId }
			templateId={ templateId }
			settings={ finalSettings }
			styles={ finalSettings.styles }
		/>
	);
}
