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
	__experimentalText as Text,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';
import { chevronLeftSmall, chevronRightSmall, layout } from '@wordpress/icons';
import { displayShortcut } from '@wordpress/keycodes';
import { store as coreStore } from '@wordpress/core-data';
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
import { getTemplateInfo } from '../../utils/get-template-info';
import { getStylesCanvasTitle } from '../styles-canvas';
import { unlock } from '../../lock-unlock';

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
	const {
		postId,
		postType,
		postTypeLabel,
		documentTitle,
		isNotFound,
		templateTitle,
		onNavigateToPreviousEntityRecord,
		isTemplatePreview,
		stylesCanvasTitle,
	} = useSelect( ( select ) => {
		const {
			getCurrentPostType,
			getCurrentPostId,
			getEditorSettings,
			getRenderingMode,
		} = select( editorStore );

		const {
			getEditedEntityRecord,
			getPostType,
			getCurrentTheme,
			isResolving: isResolvingSelector,
		} = select( coreStore );
		const _postType = getCurrentPostType();
		const _postId = getCurrentPostId();
		const _document = getEditedEntityRecord(
			'postType',
			_postType,
			_postId
		);

		const { default_template_types: templateTypes = [] } =
			getCurrentTheme() ?? {};

		const _templateInfo = getTemplateInfo( {
			templateTypes,
			template: _document,
		} );
		const _postTypeLabel = getPostType( _postType )?.labels?.singular_name;

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
			postId: _postId,
			postType: _postType,
			postTypeLabel: _postTypeLabel,
			documentTitle: _document.title,
			isNotFound:
				! _document &&
				! isResolvingSelector(
					'getEditedEntityRecord',
					'postType',
					_postType,
					_postId
				),
			templateTitle: _templateInfo.title,
			onNavigateToPreviousEntityRecord:
				getEditorSettings().onNavigateToPreviousEntityRecord,
			isTemplatePreview: getRenderingMode() === 'template-locked',
			stylesCanvasTitle: _stylesCanvasTitle,
		};
	}, [] );

	const { open: openCommandCenter } = useDispatch( commandsStore );
	const isReducedMotion = useReducedMotion();

	const isTemplate = TEMPLATE_POST_TYPES.includes( postType );
	const hasBackButton = !! onNavigateToPreviousEntityRecord;
	const entityTitle = isTemplate ? templateTitle : documentTitle;
	const title = props.title || stylesCanvasTitle || entityTitle;
	const icon = props.icon;

	const pageTypeBadge = usePageTypeBadge( postId );

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
						onClick={ ( event ) => {
							event.stopPropagation();
							onNavigateToPreviousEntityRecord();
						} }
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
				<Text>{ __( 'Document not found' ) }</Text>
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
						<Text size="body" as="h1">
							<span className="editor-document-bar__post-title">
								{ title
									? stripHTML( title )
									: __( 'No title' ) }
							</span>
							{ pageTypeBadge && (
								<span className="editor-document-bar__post-type-label">
									{ `· ${ pageTypeBadge }` }
								</span>
							) }
							{ postTypeLabel &&
								! props.title &&
								! pageTypeBadge && (
									<span className="editor-document-bar__post-type-label">
										{ `· ${ decodeEntities(
											postTypeLabel
										) }` }
									</span>
								) }
						</Text>
					</motion.div>
					<span className="editor-document-bar__shortcut">
						{ displayShortcut.primary( 'k' ) }
					</span>
				</Button>
			) }
		</div>
	);
}
