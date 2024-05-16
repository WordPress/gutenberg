/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { usePaddingAppender } from './use-padding-appender';

const { EditorCanvas } = unlock( editorPrivateApis );

const isGutenbergPlugin = process.env.IS_GUTENBERG_PLUGIN ? true : false;

export default function VisualEditor( { styles } ) {
	const {
		isWelcomeGuideVisible,
		renderingMode,
		isBlockBasedTheme,
		hasV3BlocksOnly,
		isEditingTemplate,
		isZoomedOutView,
	} = useSelect( ( select ) => {
		const { isFeatureActive } = select( editPostStore );
		const { getEditorSettings, getRenderingMode } = select( editorStore );
		const { getBlockTypes } = select( blocksStore );
		const { __unstableGetEditorMode } = select( blockEditorStore );
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
			isZoomedOutView: __unstableGetEditorMode() === 'zoom-out',
		};
	}, [] );
	const hasMetaBoxes = useSelect(
		( select ) => select( editPostStore ).hasMetaBoxes(),
		[]
	);

	const paddingAppenderRef = usePaddingAppender();

	let paddingBottom;

	// Add a constant padding for the typewritter effect. When typing at the
	// bottom, there needs to be room to scroll up.
	if (
		! isZoomedOutView &&
		! hasMetaBoxes &&
		renderingMode === 'post-only'
	) {
		paddingBottom = '40vh';
	}

	styles = useMemo(
		() => [
			...styles,
			{
				// We should move this in to future to the body.
				css: paddingBottom
					? `body{padding-bottom:${ paddingBottom }}`
					: '',
			},
		],
		[ styles, paddingBottom ]
	);

	const isToBeIframed =
		( ( hasV3BlocksOnly || ( isGutenbergPlugin && isBlockBasedTheme ) ) &&
			! hasMetaBoxes ) ||
		isEditingTemplate;

	return (
		<div
			className={ clsx( 'edit-post-visual-editor', {
				'has-inline-canvas': ! isToBeIframed,
			} ) }
		>
			<EditorCanvas
				disableIframe={ ! isToBeIframed }
				styles={ styles }
				// We should auto-focus the canvas (title) on load.
				// eslint-disable-next-line jsx-a11y/no-autofocus
				autoFocus={ ! isWelcomeGuideVisible }
				contentRef={ paddingAppenderRef }
			/>
		</div>
	);
}
