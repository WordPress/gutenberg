/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { store as editorStore } from '@wordpress/editor';
import {
	BlockList,
	BlockTools,
	__unstableUseTypewriter as useTypewriter,
	__experimentalUseResizeCanvas as useResizeCanvas,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useEffect, useRef, useMemo } from '@wordpress/element';
import { __unstableMotion as motion } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMergeRefs } from '@wordpress/compose';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { ExperimentalBlockCanvas: BlockCanvas } = unlock(
	blockEditorPrivateApis
);

const isGutenbergPlugin = process.env.IS_GUTENBERG_PLUGIN ? true : false;

export default function VisualEditor( { styles } ) {
	const {
		deviceType,
		isWelcomeGuideVisible,
		isTemplateMode,
		isBlockBasedTheme,
		hasV3BlocksOnly,
		shouldDisableLayoutStyles,
	} = useSelect( ( select ) => {
		const {
			isFeatureActive,
			isEditingTemplate,
			__experimentalGetPreviewDeviceType,
		} = select( editPostStore );
		const { getEditorSettings } = select( editorStore );
		const { getBlockTypes } = select( blocksStore );
		const settings = getEditorSettings();

		return {
			deviceType: __experimentalGetPreviewDeviceType(),
			isWelcomeGuideVisible: isFeatureActive( 'welcomeGuide' ),
			isTemplateMode: isEditingTemplate(),
			isBlockBasedTheme: settings.__unstableIsBlockBasedTheme,
			hasV3BlocksOnly: getBlockTypes().every( ( type ) => {
				return type.apiVersion >= 3;
			} ),
			shouldDisableLayoutStyles:
				! settings.supportsLayout || settings.disableLayoutStyles,
		};
	}, [] );
	const { isCleanNewPost } = useSelect( editorStore );
	const hasMetaBoxes = useSelect(
		( select ) => select( editPostStore ).hasMetaBoxes(),
		[]
	);
	const { setRenderingMode } = useDispatch( editorStore );
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
	const resizedCanvasStyles = useResizeCanvas( deviceType, isTemplateMode );
	const previewMode = 'is-' + deviceType.toLowerCase() + '-preview';

	let animatedStyles = isTemplateMode
		? templateModeStyles
		: desktopCanvasStyles;
	if ( resizedCanvasStyles ) {
		animatedStyles = resizedCanvasStyles;
	}

	let paddingBottom;

	// Add a constant padding for the typewritter effect. When typing at the
	// bottom, there needs to be room to scroll up.
	if ( ! hasMetaBoxes && ! resizedCanvasStyles && ! isTemplateMode ) {
		paddingBottom = '40vh';
	}

	const ref = useRef();
	const contentRef = useMergeRefs( [ ref, useTypewriter() ] );

	const titleRef = useRef();
	useEffect( () => {
		if ( isWelcomeGuideVisible || ! isCleanNewPost() ) {
			return;
		}
		titleRef?.current?.focus();
	}, [ isWelcomeGuideVisible, isCleanNewPost ] );
	useEffect( () => {
		if ( isTemplateMode ) {
			setRenderingMode( 'all' );
		} else {
			setRenderingMode( 'post-only' );
		}
	}, [ isTemplateMode, setRenderingMode ] );

	styles = useMemo(
		() => [
			...styles,
			{
				// Themes apply a max width to wp-block class,
				// this resets that max width for the top level blocks added by the framework (post content, post title)
				css: shouldDisableLayoutStyles
					? '.wp-site-blocks > .wp-block { max-width: none !important; width: 100% !important; }'
					: '',
			},
			{
				// We should move this in to future to the body.
				css: paddingBottom
					? `body{padding-bottom:${ paddingBottom }}`
					: '',
			},
		],
		[ styles, shouldDisableLayoutStyles, paddingBottom ]
	);

	const isToBeIframed =
		( ( hasV3BlocksOnly || ( isGutenbergPlugin && isBlockBasedTheme ) ) &&
			! hasMetaBoxes ) ||
		isTemplateMode ||
		deviceType === 'Tablet' ||
		deviceType === 'Mobile';

	return (
		<BlockTools
			__unstableContentRef={ ref }
			className={ classnames( 'edit-post-visual-editor', {
				'is-template-mode': isTemplateMode,
				'has-inline-canvas': ! isToBeIframed,
			} ) }
		>
			<motion.div
				className="edit-post-visual-editor__content-area"
				animate={ {
					padding: isTemplateMode ? '48px 48px 0' : 0,
				} }
			>
				<motion.div
					animate={ animatedStyles }
					initial={ desktopCanvasStyles }
					className={ previewMode }
				>
					<BlockCanvas
						shouldIframe={ isToBeIframed }
						contentRef={ contentRef }
						styles={ styles }
						height="100%"
					>
						<BlockList
							className="wp-site-blocks"
							dropZoneElement={
								// When iframed, pass in the html element of the iframe to
								// ensure the drop zone extends to the edges of the iframe.
								isToBeIframed
									? ref.current?.parentNode
									: ref.current
							}
						/>
					</BlockCanvas>
				</motion.div>
			</motion.div>
		</BlockTools>
	);
}
