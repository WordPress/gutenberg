/**
 * External dependencies
 */
import clsx from 'clsx';

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
	usePrevious,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useState, useRef, useEffect } from '@wordpress/element';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { CommandMenu } from '@wordpress/commands';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import {
	EditorSnackbars,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { privateApis as coreCommandsPrivateApis } from '@wordpress/core-commands';

/**
 * Internal dependencies
 */
import ErrorBoundary from '../error-boundary';
import { store as editSiteStore } from '../../store';
import { default as SiteHub, SiteHubMobile } from '../site-hub';
import ResizableFrame from '../resizable-frame';
import { unlock } from '../../lock-unlock';
import KeyboardShortcutsRegister from '../keyboard-shortcuts/register';
import KeyboardShortcutsGlobal from '../keyboard-shortcuts/global';
import { useIsSiteEditorLoading } from './hooks';
import useMovingAnimation from './animation';
import SidebarContent from '../sidebar';
import SaveHub from '../save-hub';
import SavePanel from '../save-panel';
import useSyncCanvasModeWithURL from '../sync-state-with-url/use-sync-canvas-mode-with-url';

const { useCommands } = unlock( coreCommandsPrivateApis );
const { useGlobalStyle } = unlock( blockEditorPrivateApis );
const { NavigableRegion } = unlock( editorPrivateApis );

const ANIMATION_DURATION = 0.3;

export default function Layout( { route } ) {
	useSyncCanvasModeWithURL();
	useCommands();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const toggleRef = useRef();
	const { canvasMode, previousShortcut, nextShortcut } = useSelect(
		( select ) => {
			const { getAllShortcutKeyCombinations } = select(
				keyboardShortcutsStore
			);
			const { getCanvasMode } = unlock( select( editSiteStore ) );
			return {
				canvasMode: getCanvasMode(),
				previousShortcut: getAllShortcutKeyCombinations(
					'core/editor/previous-region'
				),
				nextShortcut: getAllShortcutKeyCombinations(
					'core/editor/next-region'
				),
			};
		},
		[]
	);
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
	const { key: routeKey, areas, widths } = route;
	const animationRef = useMovingAnimation( {
		triggerAnimationOnChange: canvasMode + '__' + routeKey,
	} );

	const [ backgroundColor ] = useGlobalStyle( 'color.background' );
	const [ gradientValue ] = useGlobalStyle( 'color.gradient' );
	const previousCanvaMode = usePrevious( canvasMode );
	useEffect( () => {
		if ( previousCanvaMode === 'edit' ) {
			toggleRef.current?.focus();
		}
		// Should not depend on the previous canvas mode value but the next.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ canvasMode ] );

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
				className={ clsx(
					'edit-site-layout',
					navigateRegionsProps.className,
					{
						'is-full-canvas': canvasMode === 'edit',
					}
				) }
			>
				<div className="edit-site-layout__content">
					{ /*
						The NavigableRegion must always be rendered and not use
						`inert` otherwise `useNavigateRegions` will fail.
					*/ }
					{ ( ! isMobileViewport || ! areas.mobile ) && (
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
												disableMotion ||
												isMobileViewport
													? 0
													: ANIMATION_DURATION,
											ease: 'easeOut',
										} }
										className="edit-site-layout__sidebar"
									>
										<SiteHub
											ref={ toggleRef }
											isTransparent={
												isResizableFrameOversized
											}
										/>
										<SidebarContent routeKey={ routeKey }>
											{ areas.sidebar }
										</SidebarContent>
										<SaveHub />
										<SavePanel />
									</motion.div>
								) }
							</AnimatePresence>
						</NavigableRegion>
					) }

					<EditorSnackbars />

					{ isMobileViewport && areas.mobile && (
						<div className="edit-site-layout__mobile">
							{ canvasMode !== 'edit' && (
								<SidebarContent routeKey={ routeKey }>
									<SiteHubMobile
										ref={ toggleRef }
										isTransparent={
											isResizableFrameOversized
										}
									/>
								</SidebarContent>
							) }
							{ areas.mobile }
						</div>
					) }

					{ ! isMobileViewport &&
						areas.content &&
						canvasMode !== 'edit' && (
							<div
								className="edit-site-layout__area"
								style={ {
									maxWidth: widths?.content,
								} }
							>
								{ areas.content }
							</div>
						) }

					{ ! isMobileViewport && areas.edit && (
						<div
							className="edit-site-layout__area"
							style={ {
								maxWidth: widths?.edit,
							} }
						>
							{ areas.edit }
						</div>
					) }

					{ ! isMobileViewport && areas.preview && (
						<div className="edit-site-layout__canvas-container">
							{ canvasResizer }
							{ !! canvasSize.width && (
								<div
									className={ clsx(
										'edit-site-layout__canvas',
										{
											'is-right-aligned':
												isResizableFrameOversized,
										}
									) }
									ref={ animationRef }
								>
									<ErrorBoundary>
										<ResizableFrame
											isReady={ ! isEditorLoading }
											isFullWidth={
												canvasMode === 'edit'
											}
											defaultSize={ {
												width:
													canvasSize.width -
													24 /* $canvas-padding */,
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
								</div>
							) }
						</div>
					) }
				</div>
			</div>
		</>
	);
}
