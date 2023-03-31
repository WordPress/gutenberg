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
	ResizableBox,
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

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import Editor from '../editor';
import ListPage from '../list';
import ErrorBoundary from '../error-boundary';
import { store as editSiteStore } from '../../store';
import { useLocation } from '../routes';
import getIsListPage from '../../utils/get-is-list-page';
import Header from '../header-edit-mode';
import useInitEditedEntityFromURL from '../sync-state-with-url/use-init-edited-entity-from-url';
import SiteHub from '../site-hub';
import ResizeHandle from '../block-editor/resize-handle';
import useSyncCanvasModeWithURL from '../sync-state-with-url/use-sync-canvas-mode-with-url';
import { unlock } from '../../private-apis';
import SavePanel from '../save-panel';
import KeyboardShortcutsRegister from '../keyboard-shortcuts/register';
import KeyboardShortcutsGlobal from '../keyboard-shortcuts/global';

const ANIMATION_DURATION = 0.5;
const emptyResizeHandleStyles = {
	position: undefined,
	userSelect: undefined,
	cursor: undefined,
	width: undefined,
	height: undefined,
	top: undefined,
	right: undefined,
	bottom: undefined,
	left: undefined,
};

export default function Layout() {
	// This ensures the edited entity id and type are initialized properly.
	useInitEditedEntityFromURL();
	useSyncCanvasModeWithURL();

	const hubRef = useRef();
	const { params } = useLocation();
	const isListPage = getIsListPage( params );
	const isEditorPage = ! isListPage;
	const { canvasMode, previousShortcut, nextShortcut } = useSelect(
		( select ) => {
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
			};
		},
		[]
	);
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
		( isMobileViewport && isEditorPage && canvasMode === 'edit' ) ||
		! isMobileViewport ||
		! isEditorPage;
	const isFullCanvas =
		( isMobileViewport && isListPage ) ||
		( isEditorPage && canvasMode === 'edit' );
	const [ fullResizer, fullSize ] = useResizeObserver();
	const [ forcedWidth, setForcedWidth ] = useState( null );
	const [ isResizing, setIsResizing ] = useState( false );
	const isResizingEnabled = ! isMobileViewport && canvasMode === 'view';
	const defaultSidebarWidth = isMobileViewport ? '100vw' : 360;

	// Synchronizing the URL with the store value of canvasMode happens in an effect
	// This condition ensures the component is only rendered after the synchronization happens
	// which prevents any animations due to potential canvasMode value change.
	if ( canvasMode === 'init' ) {
		return null;
	}

	return (
		<>
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
						'is-edit-mode': canvasMode === 'edit',
					}
				) }
			>
				<SiteHub
					ref={ hubRef }
					className="edit-site-layout__hub"
					style={ {
						width:
							isResizingEnabled && forcedWidth
								? forcedWidth - 48
								: undefined,
					} }
				/>

				<div className="edit-site-layout__content">
					<AnimatePresence initial={ false }>
						{ showSidebar && (
							<ResizableBox
								as={ motion.div }
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
									duration:
										disableMotion || isResizing
											? 0
											: ANIMATION_DURATION,
									ease: 'easeOut',
								} }
								size={ {
									height: '100%',
									width:
										isResizingEnabled && forcedWidth
											? forcedWidth
											: defaultSidebarWidth,
								} }
								className="edit-site-layout__sidebar"
								enable={ {
									right: isResizingEnabled,
								} }
								onResizeStop={ ( event, direction, elt ) => {
									setForcedWidth( elt.clientWidth );
									setIsResizing( false );
								} }
								onResizeStart={ () => {
									setIsResizing( true );
								} }
								onResize={ ( event, direction, elt ) => {
									// This is a performance optimization
									// We set the width imperatively to avoid re-rendering
									// the whole component while resizing.
									hubRef.current.style.width =
										elt.clientWidth - 48 + 'px';
								} }
								handleComponent={ {
									right: (
										<ResizeHandle
											direction="right"
											variation="separator"
											resizeWidthBy={ ( delta ) => {
												setForcedWidth(
													( forcedWidth ??
														defaultSidebarWidth ) +
														delta
												);
											} }
										/>
									),
								} }
								handleClasses={ undefined }
								handleStyles={ {
									right: emptyResizeHandleStyles,
								} }
								minWidth={ isResizingEnabled ? 320 : undefined }
								maxWidth={
									isResizingEnabled && fullSize
										? fullSize.width - 360
										: undefined
								}
							>
								<NavigableRegion
									ariaLabel={ __( 'Navigation sidebar' ) }
								>
									<Sidebar />
								</NavigableRegion>
							</ResizableBox>
						) }
					</AnimatePresence>
					<SavePanel />
					{ showCanvas && (
						<ErrorBoundary>
							<motion.div
								layout
								// drag={ isListPage || canvasMode !== 'edit' }
								// dragMomentum={ false }
								className={ classnames( 'the-frame', {
									edit: canvasMode === 'edit',
									secondary: isListPage,
								} ) }
							>
								<AnimatePresence initial={ false }>
									{ isEditorPage && canvasMode === 'edit' && (
										<NavigableRegion
											className="edit-site-layout__header"
											ariaLabel={ __( 'Editor top bar' ) }
										>
											{ canvasMode === 'edit' && (
												<Header />
											) }
										</NavigableRegion>
									) }
								</AnimatePresence>
								<Editor secondary={ isListPage } />
							</motion.div>
							{ isListPage && <ListPage /> }
						</ErrorBoundary>
					) }
				</div>
			</div>
		</>
	);
}
