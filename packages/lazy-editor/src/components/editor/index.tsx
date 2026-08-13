import type { ComponentType, ReactNode } from 'react';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { store as coreDataStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useStylesId } from '../../hooks/use-styles-id';
import { useEditorSettings } from '../../hooks/use-editor-settings';
import { useEditorAssets } from '../../hooks/use-editor-assets';
import { unlock } from '../../lock-unlock';

const { Editor: PrivateEditor, BackButton } = unlock( editorPrivateApis );

/**
 * Renders `@wordpress/block-library`'s keyboard shortcuts.
 *
 * The module is imported dynamically because `@wordpress/block-library` is one
 * of the editor assets this package loads on demand: a static import resolves
 * `window.wp.blockLibrary` while this module is evaluated, which is before
 * those assets exist.
 *
 * Ideally this component wouldn't exist at all: it hardcodes transforms for two
 * specific core blocks. Blocks should declare their own shortcuts, so any block
 * can register them and the editor doesn't need to know about them.
 *
 * @return The block keyboard shortcuts, once they can be resolved.
 */
function BlockKeyboardShortcuts() {
	const [ Shortcuts, setShortcuts ] = useState< ComponentType | null >(
		null
	);

	useEffect( () => {
		let ignore = false;
		import( '@wordpress/block-library' )
			.then( ( module ) => {
				if ( ! ignore ) {
					setShortcuts(
						() =>
							unlock( module.privateApis ).BlockKeyboardShortcuts
					);
				}
			} )
			.catch( ( error: Error ) => {
				// eslint-disable-next-line no-console
				console.error(
					'Failed to load the block keyboard shortcuts:',
					error
				);
			} );
		return () => {
			ignore = true;
		};
	}, [] );

	return Shortcuts ? <Shortcuts /> : null;
}

interface EditorProps {
	postType?: string;
	postId?: string;
	settings?: Record< string, any >;
	backButton?: ReactNode;
}

/**
 * Lazy-loading editor component that handles asset loading and settings initialization.
 *
 * @param {Object}    props            Component props
 * @param {string}    props.postType   Optional post type to edit. If not provided, resolves to homepage.
 * @param {string}    props.postId     Optional post ID to edit. If not provided, resolves to homepage.
 * @param {Object}    props.settings   Optional extra settings to merge with editor settings
 * @param {ReactNode} props.backButton Optional back button to render in editor header
 * @return The editor component with loading states
 */
export function Editor( {
	postType,
	postId,
	settings,
	backButton,
}: EditorProps ) {
	// Resolve homepage when no postType/postId provided
	const homePage = useSelect(
		( select ) => {
			// Only resolve homepage when both postType and postId are missing
			if ( postType || postId ) {
				return null;
			}
			const { getHomePage } = unlock( select( coreDataStore ) );
			return getHomePage();
		},
		[ postType, postId ]
	);

	// Use provided postType/postId, or fall back to homepage resolution
	const resolvedPostType = postType || homePage?.postType;
	const resolvedPostId = postId || homePage?.postId;

	// Resolve template ID from post type/ID
	const templateId = useSelect(
		( select ) => {
			if ( ! resolvedPostType || ! resolvedPostId ) {
				return undefined;
			}
			if ( resolvedPostType === 'wp_template' ) {
				return resolvedPostId;
			}
			// Use private API to get template ID for this post
			return unlock( select( coreDataStore ) ).getTemplateId(
				resolvedPostType,
				resolvedPostId
			);
		},
		[ resolvedPostType, resolvedPostId ]
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
			postType={ resolvedPostType }
			postId={ resolvedPostId }
			templateId={ templateId }
			settings={ finalSettings }
			styles={ finalSettings.styles }
		>
			{ ! finalSettings.isPreviewMode && <BlockKeyboardShortcuts /> }
			{ backButton && <BackButton>{ backButton }</BackButton> }
		</PrivateEditor>
	);
}
