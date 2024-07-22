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
import { chevronLeftSmall, chevronRightSmall } from '@wordpress/icons';
import { displayShortcut } from '@wordpress/keycodes';
import { store as coreStore } from '@wordpress/core-data';
import { store as commandsStore } from '@wordpress/commands';
import { useRef, useEffect } from '@wordpress/element';
import { useReducedMotion } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPES, GLOBAL_POST_TYPES } from '../../store/constants';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const MotionButton = motion( Button );

/**
 * This component renders a navigation bar at the top of the editor. It displays the title of the current document,
 * a back button (if applicable), and a command center button. It also handles different states of the document,
 * such as "not found" or "unsynced".
 *
 * @example
 * ```jsx
 * <DocumentBar />
 * ```
 * @param {Object}                                   props       The component props.
 * @param {string}                                   props.title A title for the document, defaulting to the document or
 *                                                               template title currently being edited.
 * @param {import("@wordpress/components").IconType} props.icon  An icon for the document, defaulting to an icon for document
 *                                                               or template currently being edited.
 *
 * @return {JSX.Element} The rendered DocumentBar component.
 */
export default function DocumentBar( props ) {
	const {
		postType,
		documentTitle,
		isNotFound,
		isUnsyncedPattern,
		templateIcon,
		templateTitle,
		onNavigateToPreviousEntityRecord,
	} = useSelect( ( select ) => {
		const {
			getCurrentPostType,
			getCurrentPostId,
			getEditorSettings,
			__experimentalGetTemplateInfo: getTemplateInfo,
		} = select( editorStore );
		const { getEditedEntityRecord, isResolving: isResolvingSelector } =
			select( coreStore );
		const _postType = getCurrentPostType();
		const _postId = getCurrentPostId();
		const _document = getEditedEntityRecord(
			'postType',
			_postType,
			_postId
		);
		const _templateInfo = getTemplateInfo( _document );
		return {
			postType: _postType,
			documentTitle: _document.title,
			isNotFound:
				! _document &&
				! isResolvingSelector(
					'getEditedEntityRecord',
					'postType',
					_postType,
					_postId
				),
			isUnsyncedPattern: _document?.wp_pattern_sync_status === 'unsynced',
			templateIcon: unlock( select( editorStore ) ).getPostIcon(
				_postType,
				{
					area: _document?.area,
				}
			),
			templateTitle: _templateInfo.title,
			onNavigateToPreviousEntityRecord:
				getEditorSettings().onNavigateToPreviousEntityRecord,
		};
	}, [] );

	const { open: openCommandCenter } = useDispatch( commandsStore );
	const isReducedMotion = useReducedMotion();

	const isTemplate = TEMPLATE_POST_TYPES.includes( postType );
	const isGlobalEntity = GLOBAL_POST_TYPES.includes( postType );
	const hasBackButton = !! onNavigateToPreviousEntityRecord;
	const entityTitle = isTemplate ? templateTitle : documentTitle;
	const title = props.title || entityTitle;
	const icon = props.icon || templateIcon;

	const mounted = useRef( false );
	useEffect( () => {
		mounted.current = true;
	}, [] );

	return (
		<div
			className={ clsx( 'editor-document-bar', {
				'has-back-button': hasBackButton,
				'is-global': isGlobalEntity && ! isUnsyncedPattern,
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
							mounted.current
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
			{ isNotFound ? (
				<Text>{ __( 'Document not found' ) }</Text>
			) : (
				<div
					className="editor-document-bar__command"
					// Force entry animation when the back button is added or removed.
					key={ hasBackButton }
					initial={
						mounted.current
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
					transition={ isReducedMotion ? { duration: 0 } : undefined }
				>
					<Button
						className="editor-document-bar__title"
						tabIndex="-1"
						onClick={ () => openCommandCenter() }
						size="compact"
					>
						<BlockIcon icon={ icon } />
						<Text size="body" as="span">
							{ title
								? decodeEntities( title )
								: __( 'No Title' ) }
						</Text>
					</Button>
					<Button
						onClick={ () => openCommandCenter() }
						className="editor-document-bar__shortcut"
						label={ __( 'Command palette' ) }
						showTooltip
						size="compact"
					>
						{ displayShortcut.primary( 'k' ) }
					</Button>
				</div>
			) }
		</div>
	);
}
