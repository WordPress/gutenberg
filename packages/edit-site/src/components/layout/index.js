/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
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
import { useState } from '@wordpress/element';
import { NavigableRegion } from '@wordpress/interface';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import {
	CommandMenu,
	privateApis as commandsPrivateApis,
} from '@wordpress/commands';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	privateApis as blockEditorPrivateApis,
	useBlockCommands,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
import { privateApis as coreCommandsPrivateApis } from '@wordpress/core-commands';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import ErrorBoundary from '../error-boundary';
import { store as editSiteStore } from '../../store';
import useInitEditedEntityFromURL from '../sync-state-with-url/use-init-edited-entity-from-url';
import ResizableFrame from '../resizable-frame';
import useSyncCanvasModeWithURL from '../sync-state-with-url/use-sync-canvas-mode-with-url';
import { unlock } from '../../lock-unlock';
import SavePanel from '../save-panel';
import KeyboardShortcutsRegister from '../keyboard-shortcuts/register';
import KeyboardShortcutsGlobal from '../keyboard-shortcuts/global';
import { useCommonCommands } from '../../hooks/commands/use-common-commands';
import { useEditModeCommands } from '../../hooks/commands/use-edit-mode-commands';
import { useIsSiteEditorLoading } from './hooks';
import useLayoutAreas from './router';
import SiteIcon from '../site-icon';

const { useCommands } = unlock( coreCommandsPrivateApis );
const { useCommandContext } = unlock( commandsPrivateApis );
const { useGlobalStyle } = unlock( blockEditorPrivateApis );

const ANIMATION_DURATION = 0.4;

export default function Layout() {
	// This ensures the edited entity id and type are initialized properly.
	useInitEditedEntityFromURL();
	useSyncCanvasModeWithURL();
	useCommands();
	useEditModeCommands();
	useCommonCommands();
	useBlockCommands();

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	const {
		isDistractionFree,
		hasFixedToolbar,
		hasBlockSelected,
		canvasMode,
		dashboardLink,
		previousShortcut,
		nextShortcut,
	} = useSelect( ( select ) => {
		const { getAllShortcutKeyCombinations } = select(
			keyboardShortcutsStore
		);
		const { getCanvasMode, getSettings } = unlock(
			select( editSiteStore )
		);

		return {
			canvasMode: getCanvasMode(),
			dashboardLink:
				getSettings().__experimentalDashboardLink || 'index.php',
			previousShortcut: getAllShortcutKeyCombinations(
				'core/edit-site/previous-region'
			),
			nextShortcut: getAllShortcutKeyCombinations(
				'core/edit-site/next-region'
			),
			hasFixedToolbar: select( preferencesStore ).get(
				'core',
				'fixedToolbar'
			),
			isDistractionFree: select( preferencesStore ).get(
				'core',
				'distractionFree'
			),
			hasBlockSelected:
				select( blockEditorStore ).getBlockSelectionStart(),
		};
	}, [] );
	const navigateRegionsProps = useNavigateRegions( {
		previous: previousShortcut,
		next: nextShortcut,
	} );
	const disableMotion = useReducedMotion();
	const [ canvasResizer, canvasSize ] = useResizeObserver();
	const [ fullResizer ] = useResizeObserver();
	const isEditorLoading = useIsSiteEditorLoading();
	const [ isResizableFrameOversized, setIsResizableFrameOversized ] =
		useState( false );
	const { areas, widths } = useLayoutAreas();

	// Sets the right context for the command palette
	let commandContext = 'site-editor';

	if ( canvasMode === 'edit' ) {
		commandContext = 'site-editor-edit';
	}
	if ( hasBlockSelected ) {
		commandContext = 'block-selection-edit';
	}
	useCommandContext( commandContext );

	const [ backgroundColor ] = useGlobalStyle( 'color.background' );
	const [ gradientValue ] = useGlobalStyle( 'color.gradient' );

	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const { setDeviceType } = useDispatch( editorStore );
	const siteIconButtonProps =
		canvasMode === 'view'
			? {
					href: dashboardLink,
					label: __( 'Go to the Dashboard' ),
			  }
			: {
					href: dashboardLink, // We need to keep the `href` here so the component doesn't remount as a `<button>` and break the animation.
					role: 'button',
					label: __( 'Open Navigation' ),
					onClick: ( event ) => {
						event.preventDefault();
						if ( canvasMode === 'edit' ) {
							clearSelectedBlock();
							setDeviceType( 'Desktop' );
							setCanvasMode( 'view' );
						}
					},
			  };

	const toggleVariants = {
		view: {
			width: 48,
			height: 48,
			top: [ 0, 30, 22 ],
			left: 16,
			borderRadius: '4px',
			boxShadow: '0px 6px 15px rgba(0,0,0,.3)',
		},
		edit: {
			width: 60,
			height: 60,
			top: [ 22, 30, 0 ],
			left: 0,
			borderRadius: '0px',
			boxShadow: 'none',
		},
	};

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
						'is-distraction-free':
							isDistractionFree && canvasMode === 'edit',
						'is-full-canvas': canvasMode === 'edit',
						'has-fixed-toolbar': hasFixedToolbar,
						'is-block-toolbar-visible': hasBlockSelected,
					}
				) }
			>
				<div className="edit-site-layout__content">
					{ /*
						The NavigableRegion must always be rendered and not use
						`inert` otherwise `useNavigateRegions` will fail.
					*/ }
					<motion.div
						className="edit-site-layout__view-mode-toggle"
						variants={ toggleVariants }
						animate={ canvasMode }
						transition={ {
							duration: ANIMATION_DURATION,
							type: 'sprint',
						} }
					>
						<Button { ...siteIconButtonProps } as={ motion.button }>
							<SiteIcon className="edit-site-layout__view-mode-toggle-icon" />
						</Button>
					</motion.div>
					<NavigableRegion
						ariaLabel={ __( 'Navigation' ) }
						className="edit-site-layout__sidebar-region"
					>
						<AnimatePresence>
							{ canvasMode === 'view' && (
								<motion.div
									initial={ { opacity: 0 } }
									animate={ { opacity: 1 } }
									exit={ { opacity: 0 } }
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
									<Sidebar />
								</motion.div>
							) }
						</AnimatePresence>
					</NavigableRegion>

					<SavePanel />

					{ areas.content && canvasMode !== 'edit' && (
						<div
							className="edit-site-layout__area"
							style={ {
								maxWidth: widths?.content,
							} }
						>
							{ areas.content }
						</div>
					) }

					{ areas.preview && (
						<div className="edit-site-layout__canvas-container">
							{ canvasResizer }
							{ !! canvasSize.width && (
								<motion.div
									initial={ false }
									layout="position"
									className={ classnames(
										'edit-site-layout__canvas',
										{
											'is-right-aligned':
												isResizableFrameOversized,
										}
									) }
									animate={ {
										left: canvasMode === 'edit' ? -392 : 0,
										right: canvasMode === 'edit' ? -16 : 0,
										top: canvasMode === 'edit' ? -16 : 0,
										bottom: canvasMode === 'edit' ? -16 : 0,
										opacity: 1,
									} }
									transition={ {
										type: 'tween',
										duration: disableMotion
											? 0
											: ANIMATION_DURATION,
										ease: 'easeOut',
									} }
								>
									<ErrorBoundary>
										<ResizableFrame
											isReady={ ! isEditorLoading }
											isFullWidth={
												canvasMode === 'edit'
											}
											defaultSize={ {
												width: canvasSize.width,
												height: canvasSize.height,
											} }
											isOversized={
												isResizableFrameOversized
											}
											setIsOversized={
												setIsResizableFrameOversized
											}
											innerContentStyle={ {
												background:
													gradientValue ??
													backgroundColor,
											} }
										>
											{ areas.preview }
										</ResizableFrame>
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
