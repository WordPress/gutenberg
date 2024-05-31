/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, isRTL, sprintf } from '@wordpress/i18n';
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
import { useRef } from '@wordpress/element';
import { useReducedMotion } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPES, GLOBAL_POST_TYPES } from '../../store/constants';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const TYPE_LABELS = {
	// translators: 1: Pattern title.
	wp_pattern: __( 'Editing pattern: %s' ),
	// translators: 1: Navigation menu title.
	wp_navigation: __( 'Editing navigation menu: %s' ),
	// translators: 1: Template title.
	wp_template: __( 'Editing template: %s' ),
	// translators: 1: Template part title.
	wp_template_part: __( 'Editing template part: %s' ),
};

const MotionButton = motion( Button );

// A fixed (pixel) value creates equal movement of the back button and title as
// opposed to a % value that ends up based on the width of the individual items.
const X_TRAVEL = 60;
const TRANSITION = { type: 'tween', ease: 'easeOut', duration: 0.144 };
const TITLE_VARIANTS = {
	enterExit: ( isTemplate ) => {
		return {
			x: isTemplate ? X_TRAVEL : `-${ X_TRAVEL }`,
			opacity: 0,
		};
	},
	rest: { opacity: 1, x: 0 },
};
const BACK_BUTTON_VARIANTS = {
	enterExit: { opacity: 0, x: X_TRAVEL },
	rest: ( isReducedMotion ) => ( {
		opacity: 1,
		x: 0,
		transition: {
			...TRANSITION,
			// After the exiting title (unless reduced motion).
			delay: isReducedMotion ? 0 : TRANSITION.duration,
		},
	} ),
};

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
 * @return {JSX.Element} The rendered DocumentBar component.
 */
export default function DocumentBar() {
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
	const title = isTemplate ? templateTitle : documentTitle;

	const refBackButtonWidth = useRef();
	const readBackButtonWidth = ( button ) => {
		if ( button && ! refBackButtonWidth.current ) {
			refBackButtonWidth.current = button.getBoundingClientRect().width;
		}
	};
	const applyBackButtonWidthStyle = ( element ) => {
		if ( refBackButtonWidth.current ) {
			element?.style?.setProperty(
				'--back-button-width',
				`${ refBackButtonWidth.current }px`
			);
		}
	};
	const transition = {
		...TRANSITION,
		duration: isReducedMotion ? 0 : TRANSITION.duration,
	};

	return (
		<div
			className={ clsx( 'editor-document-bar', {
				'has-back-button': hasBackButton,
			} ) }
		>
			<AnimatePresence>
				{ hasBackButton && (
					<MotionButton
						ref={ readBackButtonWidth }
						className="editor-document-bar__back"
						icon={ isRTL() ? chevronRightSmall : chevronLeftSmall }
						onClick={ ( event ) => {
							event.stopPropagation();
							onNavigateToPreviousEntityRecord();
						} }
						size="compact"
						variant="tertiary"
						custom={ isReducedMotion }
						variants={ BACK_BUTTON_VARIANTS }
						initial="enterExit"
						animate="rest"
						exit="enterExit"
						transition={ transition }
					>
						{ __( 'Back' ) }
					</MotionButton>
				) }
			</AnimatePresence>
			{ isNotFound ? (
				<Text>{ __( 'Document not found' ) }</Text>
			) : (
				<div
					className="editor-document-bar__core"
					ref={ applyBackButtonWidthStyle }
				>
					<Button
						onClick={ () => openCommandCenter() }
						size="compact"
						variant="tertiary"
					>
						<span className="editor-document-bar__shortcut">
							{ displayShortcut.primary( 'k' ) }
						</span>
					</Button>
					<AnimatePresence initial={ false } mode="wait">
						<motion.div
							key={ isTemplate }
							className={ clsx( 'editor-document-bar__title', {
								'is-global':
									isGlobalEntity && ! isUnsyncedPattern,
							} ) }
							custom={ isTemplate }
							variants={ TITLE_VARIANTS }
							animate="rest"
							initial="enterExit"
							exit="enterExit"
							transition={ transition }
						>
							<BlockIcon icon={ templateIcon } />
							<Text
								size="body"
								as="h1"
								aria-label={
									TYPE_LABELS[ postType ]
										? // eslint-disable-next-line @wordpress/valid-sprintf
										  sprintf(
												TYPE_LABELS[ postType ],
												title
										  )
										: undefined
								}
							>
								{ title
									? decodeEntities( title )
									: __( 'No Title' ) }
							</Text>
						</motion.div>
					</AnimatePresence>
				</div>
			) }
		</div>
	);
}
