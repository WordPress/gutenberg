/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalText as WCText,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { BlockIcon, store as blockEditorStore } from '@wordpress/block-editor';
import { chevronLeftSmall, chevronRightSmall, layout } from '@wordpress/icons';
import { store as commandsStore } from '@wordpress/commands';
import { useRef, useEffect } from '@wordpress/element';
import { useReducedMotion } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPES } from '../../store/constants';
import { store as editorStore } from '../../store';
import usePageTypeBadge from '../../utils/pageTypeBadge';
import { getStylesCanvasTitle } from '../styles-canvas';
import { unlock } from '../../lock-unlock';
import useEditedSectionDetails from './useEditedSectionDetails';
import useActiveEditorEntity from '../use-active-editor-entity';

/** @typedef {import("@wordpress/components").IconType} IconType */

const MotionButton = motion.create( Button );

/**
 * This component renders a navigation bar at the top of the editor. It displays the title of the current document,
 * a back button (if applicable), and a command center button. It also handles different states of the document,
 * such as "not found" or "unsynced".
 *
 * @example
 * ```jsx
 * <DocumentBar />
 * ```
 *
 * @param {Object}   props       The component props.
 * @param {string}   props.title A title for the document, defaulting to the document or template title currently being edited.
 * @param {IconType} props.icon  An icon for the document, no default.
 *                               (A default icon indicating the document post type is no longer used.)
 *
 * @return {React.ReactNode} The rendered DocumentBar component.
 */
export default function DocumentBar( props ) {
	// Get action to lock the pattern design
	const { stopEditingContentOnlySection } = unlock(
		useDispatch( blockEditorStore )
	);

	// Get details about the currently edited content-only section
	const unlockedPatternInfo = useEditedSectionDetails();
	const activeEntity = useActiveEditorEntity();
	const {
		postId,
		postType,
		postTypeLabel,
		record,
		isNotFound,
		templateTitle,
		isInlineGlobalEntity,
	} = activeEntity;

	const {
		onNavigateToPreviousEntityRecord,
		isTemplatePreview,
		stylesCanvasTitle,
	} = useSelect( ( select ) => {
		const { getEditorSettings, getRenderingMode } = select( editorStore );

		// Check if styles canvas is active and get its title
		const { getStylesPath, getShowStylebook } = unlock(
			select( editorStore )
		);
		const _stylesPath = getStylesPath();
		const _showStylebook = getShowStylebook();
		const _stylesCanvasTitle = getStylesCanvasTitle(
			_stylesPath,
			_showStylebook
		);

		return {
			onNavigateToPreviousEntityRecord:
				getEditorSettings().onNavigateToPreviousEntityRecord,
			isTemplatePreview: getRenderingMode() === 'template-locked',
			stylesCanvasTitle: _stylesCanvasTitle,
		};
	}, [] );

	const { open: openCommandCenter } = useDispatch( commandsStore );
	const isReducedMotion = useReducedMotion();

	const isTemplate = TEMPLATE_POST_TYPES.includes( postType );
	const hasBackButton =
		!! onNavigateToPreviousEntityRecord || !! unlockedPatternInfo;
	const entityTitle = isTemplate ? templateTitle : record?.title;

	// Use pattern info if a pattern block is unlocked, otherwise use document/entity info
	const title =
		unlockedPatternInfo?.patternTitle ||
		props.title ||
		stylesCanvasTitle ||
		entityTitle;
	const icon = props.icon;

	// Determine the back button action
	const handleBackClick = ( event ) => {
		event.stopPropagation();
		if ( unlockedPatternInfo ) {
			stopEditingContentOnlySection();
		} else if ( onNavigateToPreviousEntityRecord ) {
			onNavigateToPreviousEntityRecord();
		}
	};

	const pageTypeBadge = usePageTypeBadge(
		isInlineGlobalEntity ? undefined : postId
	);

	const mountedRef = useRef( false );
	useEffect( () => {
		mountedRef.current = true;
	}, [] );

	return (
		<div
			className={ clsx( 'editor-document-bar', {
				'has-back-button': hasBackButton,
			} ) }
		>
			<AnimatePresence>
				{ hasBackButton && (
					<MotionButton
						className="editor-document-bar__back"
						icon={ isRTL() ? chevronRightSmall : chevronLeftSmall }
						onClick={ handleBackClick }
						size="compact"
						initial={
							mountedRef.current
								? { opacity: 0, transform: 'translateX(15%)' }
								: false // Don't show entry animation when DocumentBar mounts.
						}
						animate={ { opacity: 1, transform: 'translateX(0%)' } }
						exit={ { opacity: 0, transform: 'translateX(15%)' } }
						transition={
							isReducedMotion ? { duration: 0 } : undefined
						}
					>
						{ __( 'Back' ) }
					</MotionButton>
				) }
			</AnimatePresence>
			{ ! isTemplate && isTemplatePreview && ! hasBackButton && (
				<BlockIcon
					icon={ layout }
					className="editor-document-bar__icon-layout"
				/>
			) }
			{ isNotFound ? (
				<WCText>{ __( 'Document not found' ) }</WCText>
			) : (
				<Button
					className="editor-document-bar__command"
					onClick={ () => openCommandCenter() }
					size="compact"
				>
					<motion.div
						className="editor-document-bar__title"
						// Force entry animation when the back button is added or removed.
						key={ hasBackButton }
						initial={
							mountedRef.current
								? {
										opacity: 0,
										transform: hasBackButton
											? 'translateX(15%)'
											: 'translateX(-15%)',
								  }
								: false // Don't show entry animation when DocumentBar mounts.
						}
						animate={ {
							opacity: 1,
							transform: 'translateX(0%)',
						} }
						transition={
							isReducedMotion ? { duration: 0 } : undefined
						}
					>
						{ icon && <BlockIcon icon={ icon } /> }
						<WCText size="body" as="h1">
							<span className="editor-document-bar__post-title">
								{ title
									? stripHTML( title )
									: __( 'No title' ) }
							</span>
							{ unlockedPatternInfo && (
								<span className="editor-document-bar__post-type-label">
									{ unlockedPatternInfo.type ===
									'template-part'
										? `· ${ __( 'Template Part' ) }`
										: `· ${ __( 'Pattern' ) }` }
								</span>
							) }
							{ ! unlockedPatternInfo && pageTypeBadge && (
								<span className="editor-document-bar__post-type-label">
									{ `· ${ pageTypeBadge }` }
								</span>
							) }
							{ ! unlockedPatternInfo &&
								postTypeLabel &&
								! props.title &&
								! pageTypeBadge && (
									<span className="editor-document-bar__post-type-label">
										{ `· ${ decodeEntities(
											postTypeLabel
										) }` }
									</span>
								) }
						</WCText>
					</motion.div>
				</Button>
			) }
		</div>
	);
}
