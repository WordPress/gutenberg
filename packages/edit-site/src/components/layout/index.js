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
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as coreCommandsPrivateApis } from '@wordpress/core-commands';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import Editor from '../editor';
import ListPage from '../list';
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
import { useEditModeCommands } from '../../hooks/commands/use-edit-mode-commands';
import { useIsSiteEditorLoading } from './hooks';

const { useCommands } = unlock( coreCommandsPrivateApis );
const { useCommandContext } = unlock( commandsPrivateApis );
const { useLocation } = unlock( routerPrivateApis );

const ANIMATION_DURATION = 0.5;

export default function Layout() {
	// This ensures the edited entity id and type are initialized properly.
	useInitEditedEntityFromURL();
	useSyncCanvasModeWithURL();
	useCommands();
	useEditModeCommands();

	const hubRef = useRef();
	const { params } = useLocation();
	const isListPage = getIsListPage( params );
	const isEditorPage = ! isListPage;
	const { hasFixedToolbar, canvasMode, previousShortcut, nextShortcut } =
		useSelect( ( select ) => {
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
				hasFixedToolbar:
					select( preferencesStore ).get( 'fixedToolbar' ),
			};
		}, [] );
	const isEditing = canvasMode === 'edit';
	const navigateRegionsProps = useNavigateRegions( {
		previous: previousShortcut,
		next: nextShortcut,
	} );
	const disableMotion = useReducedMotion();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
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

	// Sets the right context for the command center
	const commandContext =
		canvasMode === 'edit' && isEditorPage
			? 'site-editor-edit'
			: 'site-editor';
	useCommandContext( commandContext );

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
						'is-full-canvas': isFullCanvas,
						'is-edit-mode': isEditing,
						'has-fixed-toolbar': hasFixedToolbar,
					}
				) }
			>
				<SiteHub ref={ hubRef } className="edit-site-layout__hub" />

				<AnimatePresence initial={ false }>
					{ isEditorPage && isEditing && (
						<NavigableRegion
							className="edit-site-layout__header"
							ariaLabel={ __( 'Editor top bar' ) }
							as={ motion.div }
							animate={ {
								y: 0,
							} }
							initial={ {
								y: '-100%',
							} }
							exit={ {
								y: '-100%',
							} }
							transition={ {
								type: 'tween',
								duration: disableMotion
									? 0
									: ANIMATION_DURATION,
								ease: 'easeOut',
							} }
						>
							{ isEditing && <Header /> }
						</NavigableRegion>
					) }
				</AnimatePresence>

				<div className="edit-site-layout__content">
					<AnimatePresence initial={ false }>
						{ showSidebar && (
							<motion.div
								initial={ {
									opacity: 0,
								} }
								animate={ {
									opacity: 1,
								} }
								exit={ {
									opacity: 0,
								} }
								transition={ {
									type: 'tween',
									duration: ANIMATION_DURATION,
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
						) }
					</AnimatePresence>

					<SavePanel />

					{ showCanvas && (
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
										isEditorPage && canvasMode === 'view'
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
										{ isEditorPage && (
											<ResizableFrame
												isReady={ ! isEditorLoading }
												isFullWidth={ isEditing }
												oversizedClassName="edit-site-layout__resizable-frame-oversized"
											>
												<Editor
													isLoading={
														isEditorLoading
													}
												/>
											</ResizableFrame>
										) }
										{ isListPage && <ListPage /> }
									</ErrorBoundary>
								</motion.div>
							) }
						</div>
					) }
				</div>
			</div>
		</>
	);
}
