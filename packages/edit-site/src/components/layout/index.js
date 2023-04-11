/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
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
import { motion, useMotionValue, useTransform } from 'framer-motion';

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

const ANIMATION_DURATION = 0.2;
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

const DRAG_HANDLE_WIDTH = 4;
const SIDEBAR_DEFAULT_WIDTH = 360;

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
	const [ isResizing, setIsResizing ] = useState( false );

	const x = useMotionValue( 0 );
	const left = useTransform( x, ( x ) => x + SIDEBAR_DEFAULT_WIDTH );

	// Synchronizing the URL with the store value of canvasMode happens in an effect
	// This condition ensures the component is only rendered after the synchronization happens
	// which prevents any animations due to potential canvasMode value change.
	if ( canvasMode === 'init' ) {
		return null;
	}

	const handleResize = ( event, info ) => {
		console.log( info );
		setFrameLeft( info.point.x );
	};

	return (
		<>
			<KeyboardShortcutsRegister />
			<KeyboardShortcutsGlobal />
			{ fullResizer }
			<motion.div
				className="the-frame__handle"
				title="drag to resize"
				dragMomentum={ false }
				drag="x"
				dragConstraints={ {
					left: 0,
					right: SIDEBAR_DEFAULT_WIDTH,
				} }
				onDragStart={ () => setIsResizing( true ) }
				onDragEnd={ () => setIsResizing( false ) }
				style={ { x } }
			/>
			<motion.div
				style={ {
					right: x,
					left,
					top: 16,
					bottom: 16,
				} }
				animate={ canvasMode === 'edit' ? 'edit' : 'primary' }
				className={ classnames( 'the-frame', {
					edit: canvasMode === 'edit',
					secondary: isListPage,
					resizing: isResizing,
				} ) }
			>
				<motion.div
					className="edit-site-layout__header-wrapper"
					animate={ {
						marginTop: canvasMode === 'edit' ? 0 : -60,
					} }
					transition={ { duration: ANIMATION_DURATION } }
				>
					<NavigableRegion
						className="edit-site-layout__header"
						ariaLabel={ __( 'Editor top bar' ) }
					>
						<Header />
					</NavigableRegion>
				</motion.div>
				<Editor secondary={ isListPage } />
			</motion.div>

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
				<AnimatePresence initial={ false }>
					<motion.div
						animate={ {
							opacity: canvasMode === 'edit' ? 0.25 : 1,
						} }
						className="edit-site-layout__sidebar"
					>
						<SiteHub
							ref={ hubRef }
							className="edit-site-layout__hub"
						/>
						<NavigableRegion
							ariaLabel={ __( 'Navigation sidebar' ) }
						>
							<Sidebar />
						</NavigableRegion>
					</motion.div>
				</AnimatePresence>
				<SavePanel />
				<div className="edit-site-layout__content">
					<ErrorBoundary>
						{ isListPage && <ListPage /> }
					</ErrorBoundary>
				</div>
			</div>
		</>
	);
}
