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
import {
	BlockTools,
	__experimentalUseResizeCanvas as useResizeCanvas,
} from '@wordpress/block-editor';
import { useRef, useMemo } from '@wordpress/element';
import { __unstableMotion as motion } from '@wordpress/components';
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
		deviceType,
		isWelcomeGuideVisible,
		renderingMode,
		isBlockBasedTheme,
		hasV3BlocksOnly,
	} = useSelect( ( select ) => {
		const { isFeatureActive } = select( editPostStore );
		const { getEditorSettings, getRenderingMode, getDeviceType } =
			select( editorStore );
		const { getBlockTypes } = select( blocksStore );
		const editorSettings = getEditorSettings();

		return {
			deviceType: getDeviceType(),
			isWelcomeGuideVisible: isFeatureActive( 'welcomeGuide' ),
			renderingMode: getRenderingMode(),
			isBlockBasedTheme: editorSettings.__unstableIsBlockBasedTheme,
			hasV3BlocksOnly: getBlockTypes().every( ( type ) => {
				return type.apiVersion >= 3;
			} ),
		};
	}, [] );
	const hasMetaBoxes = useSelect(
		( select ) => select( editPostStore ).hasMetaBoxes(),
		[]
	);
	const desktopCanvasStyles = {
		height: '100%',
		width: '100%',
		marginLeft: 'auto',
		marginRight: 'auto',
		display: 'flex',
		flexFlow: 'column',
		// Default background color so that grey
		// .edit-post-editor-regions__content color doesn't show through.
		background: 'white',
	};
	const templateModeStyles = {
		...desktopCanvasStyles,
		borderRadius: '2px 2px 0 0',
		border: '1px solid #ddd',
		borderBottom: 0,
	};
	const resizedCanvasStyles = useResizeCanvas( deviceType );
	const previewMode = 'is-' + deviceType.toLowerCase() + '-preview';

	let animatedStyles =
		renderingMode === 'template-only'
			? templateModeStyles
			: desktopCanvasStyles;
	if ( resizedCanvasStyles ) {
		animatedStyles = resizedCanvasStyles;
	}

	let paddingBottom;

	// Add a constant padding for the typewritter effect. When typing at the
	// bottom, there needs to be room to scroll up.
	if (
		! hasMetaBoxes &&
		! resizedCanvasStyles &&
		renderingMode === 'post-only'
	) {
		paddingBottom = '40vh';
	}

	const ref = useRef();

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
		renderingMode === 'template-only' ||
		deviceType === 'Tablet' ||
		deviceType === 'Mobile';

	return (
		<BlockTools
			__unstableContentRef={ ref }
			className={ classnames( 'edit-post-visual-editor', {
				'is-template-mode': renderingMode === 'template-only',
				'has-inline-canvas': ! isToBeIframed,
			} ) }
		>
			<motion.div
				className="edit-post-visual-editor__content-area"
				animate={ {
					padding:
						renderingMode === 'template-only' ? '48px 48px 0' : 0,
				} }
			>
				<motion.div
					animate={ animatedStyles }
					initial={ desktopCanvasStyles }
					className={ previewMode }
				>
					<EditorCanvas
						ref={ ref }
						disableIframe={ ! isToBeIframed }
						styles={ styles }
						// We should auto-focus the canvas (title) on load.
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus={ ! isWelcomeGuideVisible }
					/>
				</motion.div>
			</motion.div>
		</BlockTools>
	);
}
