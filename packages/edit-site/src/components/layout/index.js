/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
	__unstableUseNavigateRegions as useNavigateRegions,
} from '@wordpress/components';
import {
	useReducedMotion,
	useViewportMatch,
	useResizeObserver,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useState, useRef } from '@wordpress/element';
import { NavigableRegion } from '@wordpress/interface';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import {
	CommandMenu,
	privateApis as commandsPrivateApis,
} from '@wordpress/commands';
import { store as preferencesStore } from '@wordpress/preferences';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as coreCommandsPrivateApis } from '@wordpress/core-commands';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import Editor from '../editor';
import ErrorBoundary from '../error-boundary';
import { store as editSiteStore } from '../../store';
import getIsListPage from '../../utils/get-is-list-page';
import Header from '../header-edit-mode';
import useInitEditedEntityFromURL from '../sync-state-with-url/use-init-edited-entity-from-url';
import SiteHub from '../site-hub';
import ResizableFrame from '../resizable-frame';
import useSyncCanvasModeWithURL from '../sync-state-with-url/use-sync-canvas-mode-with-url';
import { unlock } from '../../lock-unlock';
import SavePanel from '../save-panel';
import KeyboardShortcutsRegister from '../keyboard-shortcuts/register';
import KeyboardShortcutsGlobal from '../keyboard-shortcuts/global';
import { useCommonCommands } from '../../hooks/commands/use-common-commands';
import { useEditModeCommands } from '../../hooks/commands/use-edit-mode-commands';
import PageMain from '../page-main';
import { useIsSiteEditorLoading } from './hooks';

const { useCommands } = unlock( coreCommandsPrivateApis );
const { useCommandContext } = unlock( commandsPrivateApis );
const { useLocation } = unlock( routerPrivateApis );
const { useGlobalStyle } = unlock( blockEditorPrivateApis );

const ANIMATION_DURATION = 0.5;

export default function Layout() {
	// This ensures the edited entity id and type are initialized properly.
	useInitEditedEntityFromURL();
	useSyncCanvasModeWithURL();
	useCommands();
	useEditModeCommands();
	useCommonCommands();

	const hubRef = useRef();
	const { params } = useLocation();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isListPage = getIsListPage( params, isMobileViewport );
	const isEditorPage = ! isListPage;

	const {
		isDistractionFree,
		hasFixedToolbar,
		canvasMode,
		previousShortcut,
		nextShortcut,
	} = useSelect( ( select ) => {
		const { getAllShortcutKeyCombinations } = select(
			keyboardShortcutsStore
		);
		const { getCanvasMode } = unlock( select( editSiteStore ) );
		return {
			canvasMode: getCanvasMode(),
			previousShortcut: getAllShortcutKeyCombinations(
				'core/edit-site/previous-region'
			),
			nextShortcut: getAllShortcutKeyCombinations(
				'core/edit-site/next-region'
			),
			hasFixedToolbar: select( preferencesStore ).get(
				'core/edit-site',
				'fixedToolbar'
			),
			isDistractionFree: select( preferencesStore ).get(
				'core/edit-site',
				'distractionFree'
			),
		};
	}, [] );
	const isEditing = canvasMode === 'edit';
	const navigateRegionsProps = useNavigateRegions( {
		previous: previousShortcut,
		next: nextShortcut,
	} );
	const disableMotion = useReducedMotion();
	const showSidebar =
		( isMobileViewport && ! isListPage ) ||
		( ! isMobileViewport && ( canvasMode === 'view' || ! isEditorPage ) );
	const showCanvas =
		( isMobileViewport && isEditorPage && isEditing ) ||
		! isMobileViewport ||
		! isEditorPage;
	const isFullCanvas =
		( isMobileViewport && isListPage ) || ( isEditorPage && isEditing );
	const [ canvasResizer, canvasSize ] = useResizeObserver();
	const [ fullResizer ] = useResizeObserver();
	const [ isResizing ] = useState( false );
	const isEditorLoading = useIsSiteEditorLoading();

	// This determines which animation variant should apply to the header.
	// There is also a `isDistractionFreeHovering` state that gets priority
	// when hovering the `edit-site-layout__header-container` in distraction
	// free mode. It's set via framer and trickles down to all the children
	// so they can use this variant state too.
	//
	// TODO: The issue with this is we want to have the hover state stick when hovering
	// a popover opened via the header. We'll probably need to lift this state to
	// handle it ourselves. Also, focusWithin the header needs to be handled.
	let headerAnimationState;

	if ( canvasMode === 'view' ) {
		// We need 'view' to always take priority so 'isDistractionFree'
		// doesn't bleed over into the view (sidebar) state
		headerAnimationState = 'view';
	} else if ( isDistractionFree ) {
		headerAnimationState = 'isDistractionFree';
	} else {
		headerAnimationState = canvasMode; // edit, view, init
	}

	// Sets the right context for the command center
	const commandContext =
		canvasMode === 'edit' && isEditorPage
			? 'site-editor-edit'
			: 'site-editor';
	useCommandContext( commandContext );

	const [ backgroundColor ] = useGlobalStyle( 'color.background' );
	const [ gradientValue ] = useGlobalStyle( 'color.gradient' );

	// Synchronizing the URL with the store value of canvasMode happens in an effect
	// This condition ensures the component is only rendered after the synchronization happens
	// which prevents any animations due to potential canvasMode value change.
	if ( canvasMode === 'init' ) {
		return null;
	}

	return (
		<>
			<CommandMenu />
			<KeyboardShortcutsRegister />
			<KeyboardShortcutsGlobal />
			{ fullResizer }
			<div
				{ ...navigateRegionsProps }
				ref={ navigateRegionsProps.ref }
				className={ classnames(
					'edit-site-layout',
					navigateRegionsProps.className,
					{
						'is-distraction-free': isDistractionFree && isEditing,
						'is-full-canvas': isFullCanvas,
						'is-edit-mode': isEditing,
						'has-fixed-toolbar': hasFixedToolbar,
					}
				) }
			>
				<motion.div
					className="edit-site-layout__header-container"
					variants={ {
						isDistractionFree: {
							opacity: 0,
							transition: {
								type: 'tween',
								delay: 0.8,
								delayChildren: 0.8,
							}, // How long to wait before the header exits
						},
						isDistractionFreeHovering: {
							opacity: 1,
							transition: {
								type: 'tween',
								delay: 0.2,
								delayChildren: 0.2,
							}, // How long to wait before the header shows
						},
						view: { opacity: 1 },
						edit: { opacity: 1 },
					} }
					whileHover={
						isDistractionFree
							? 'isDistractionFreeHovering'
							: undefined
					}
					animate={ headerAnimationState }
				>
					<SiteHub
						as={ motion.div }
						variants={ {
							isDistractionFree: { x: '-100%' },
							isDistractionFreeHovering: { x: 0 },
							view: { x: 0 },
							edit: { x: 0 },
						} }
						ref={ hubRef }
						className="edit-site-layout__hub"
					/>

					<AnimatePresence initial={ false }>
						{ isEditorPage && isEditing && (
							<NavigableRegion
								className="edit-site-layout__header"
								ariaLabel={ __( 'Editor top bar' ) }
								as={ motion.div }
								variants={ {
									isDistractionFree: { opacity: 0 },
									isDistractionFreeHovering: { opacity: 1 },
									view: { opacity: 1 },
									edit: { opacity: 1 },
								} }
								transition={ {
									type: 'tween',
									duration: disableMotion ? 0 : 0.2,
									ease: 'easeOut',
								} }
							>
								{ isEditing && <Header /> }
							</NavigableRegion>
						) }
					</AnimatePresence>
				</motion.div>

				<div className="edit-site-layout__content">
					<AnimatePresence initial={ false }>
						{
							<motion.div
								initial={ {
									opacity: 0,
								} }
								animate={
									showSidebar
										? { opacity: 1, display: 'block' }
										: {
												opacity: 0,
												transitionEnd: {
													display: 'none',
												},
										  }
								}
								exit={ {
									opacity: 0,
								} }
								transition={ {
									type: 'tween',
									duration:
										// Disable transition in mobile to emulate a full page transition.
										disableMotion || isMobileViewport
											? 0
											: ANIMATION_DURATION,
									ease: 'easeOut',
								} }
								className="edit-site-layout__sidebar"
							>
								<NavigableRegion
									ariaLabel={ __( 'Navigation' ) }
								>
									<Sidebar />
								</NavigableRegion>
							</motion.div>
						}
					</AnimatePresence>

					<SavePanel />

					{ showCanvas && (
						<>
							{ isListPage && <PageMain /> }
							{ isEditorPage && (
								<div
									className={ classnames(
										'edit-site-layout__canvas-container',
										{
											'is-resizing': isResizing,
										}
									) }
								>
									{ canvasResizer }
									{ !! canvasSize.width && (
										<motion.div
											whileHover={
												isEditorPage &&
												canvasMode === 'view'
													? {
															scale: 1.005,
															transition: {
																duration:
																	disableMotion ||
																	isResizing
																		? 0
																		: 0.5,
																ease: 'easeOut',
															},
													  }
													: {}
											}
											initial={ false }
											layout="position"
											className="edit-site-layout__canvas"
											transition={ {
												type: 'tween',
												duration:
													disableMotion || isResizing
														? 0
														: ANIMATION_DURATION,
												ease: 'easeOut',
											} }
										>
											<ErrorBoundary>
												<ResizableFrame
													isReady={
														! isEditorLoading
													}
													isFullWidth={ isEditing }
													oversizedClassName="edit-site-layout__resizable-frame-oversized"
													innerContentStyle={ {
														background:
															gradientValue ??
															backgroundColor,
													} }
												>
													<Editor
														isLoading={
															isEditorLoading
														}
													/>
												</ResizableFrame>
											</ErrorBoundary>
										</motion.div>
									) }
								</div>
							) }
						</>
					) }
				</div>
			</div>
		</>
	);
}
