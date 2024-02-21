/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { EditorCanvas } = unlock( editorPrivateApis );

const isGutenbergPlugin = process.env.IS_GUTENBERG_PLUGIN ? true : false;

export default function VisualEditor( { styles } ) {
	const {
		isWelcomeGuideVisible,
		isBlockBasedTheme,
		hasV3BlocksOnly,
		isEditingTemplate,
	} = useSelect( ( select ) => {
		const { isFeatureActive } = select( editPostStore );
		const { getEditorSettings, getRenderingMode } = select( editorStore );
		const { getBlockTypes } = select( blocksStore );
		const editorSettings = getEditorSettings();

		return {
			isWelcomeGuideVisible: isFeatureActive( 'welcomeGuide' ),
			renderingMode: getRenderingMode(),
			isBlockBasedTheme: editorSettings.__unstableIsBlockBasedTheme,
			hasV3BlocksOnly: getBlockTypes().every( ( type ) => {
				return type.apiVersion >= 3;
			} ),
			isEditingTemplate:
				select( editorStore ).getCurrentPostType() === 'wp_template',
		};
	}, [] );

	const isToBeIframed =
		hasV3BlocksOnly ||
		isGutenbergPlugin ||
		isBlockBasedTheme ||
		isEditingTemplate;

	return (
		<div
			className={ classnames( 'edit-post-visual-editor', {
				'has-inline-canvas': ! isToBeIframed,
			} ) }
		>
			<EditorCanvas
				disableIframe={ ! isToBeIframed }
				styles={ styles }
				// We should auto-focus the canvas (title) on load.
				// eslint-disable-next-line jsx-a11y/no-autofocus
				autoFocus={ ! isWelcomeGuideVisible }
			/>
		</div>
	);
}
