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
import { useState, useRef, useEffect } from '@wordpress/element';
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
import useSyncCanvasModeWithURL from '../sync-state-with-url/use-sync-canvas-mode-with-url';
import { unlock } from '../../private-apis';
import SavePanel from '../save-panel';
import KeyboardShortcutsRegister from '../keyboard-shortcuts/register';
import KeyboardShortcutsGlobal from '../keyboard-shortcuts/global';

const FRAME_TRANSITION = { type: 'tween', duration: 0.4 };

const SIDEBAR_DEFAULT_WIDTH = 360;
const MIN_FRAME_SIZE = 240;

// Removes the inline styles in the drag handles.
const HANDLE_STYLES_OVERRIDE = {
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

const frameVariants = {
	edit: {
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		transition: FRAME_TRANSITION,
	},
	primary: {
		top: 16,
		bottom: 16,
		left: SIDEBAR_DEFAULT_WIDTH,
		right: 16,
		transition: FRAME_TRANSITION,
	},
};

const devices = [
	{
		label: 'Mobile',
		width: 480,
		height: 640,
	},
	{
		label: 'Tablet',
		width: 1024,
		height: 768,
	},
	{
		label: 'Desktop',
		width: null,
		height: '100%',
	},
];

export default function Layout() {
	// This ensures the edited entity id and type are initialized properly.
	useInitEditedEntityFromURL();
	useSyncCanvasModeWithURL();

	const frameRef = useRef();
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
	const [ isResizing, setIsResizing ] = useState( false );
	const [ isHovering, setIsHovering ] = useState( false );

	const [ fullResizer, { height: fullHeight, width: fullWidth } ] =
		useResizeObserver();

	const [ frameWidth, setFrameWidth ] = useState( '100%' );
	const [ frameDevice, setFrameDevice ] = useState( 'Desktop' );
	const frameHeight = isEditing ? '100%' : frameDevice?.height || '100%';

	const frameAnimate = isEditing ? 'edit' : 'primary';

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
			<motion.div
				variants={ frameVariants }
				initial={ isEditing ? 'edit' : 'primary' }
				animate={ frameAnimate }
				ref={ frameRef }
				onMouseOver={ () => setIsHovering( true ) }
				onMouseOut={ () => setIsHovering( false ) }
				className={ classnames( 'the-frame', {
					edit: isEditing,
					secondary: isListPage,
					resizing: isResizing,
				} ) }
			>
				{ fullResizer }
				{ !! fullWidth && (
					<>
						{ isResizing && (
							<div className="the-frame__devices">
								{ devices.map( ( device ) => (
									<div
										className="the-frame__device"
										key={ device.label }
										style={ { width: device.width } }
									/>
								) ) }
							</div>
						) }
						<ResizableBox
							as={ motion.div }
							initial={ false }
							animate={ {
								flexGrow: isEditing ? 1 : 0,
								height: frameHeight,
							} }
							transition={ FRAME_TRANSITION }
							size={ {
								width: frameWidth,
							} }
							enable={ {
								top: false,
								right: false,
								bottom: false,
								left: true,
								topRight: false,
								bottomRight: false,
								bottomLeft: false,
								topLeft: false,
							} }
							resizeRatio={ 2 }
							handleClasses={ undefined }
							handleStyles={ {
								left: HANDLE_STYLES_OVERRIDE,
								right: HANDLE_STYLES_OVERRIDE,
							} }
							minWidth={ MIN_FRAME_SIZE }
							maxWidth={ '100%' }
							maxHeight={ '100%' }
							handleComponent={ {
								left: ! isHovering ? null : (
									<motion.div
										key="handle"
										className="the-frame__handle"
										title="drag to resize"
										onMouseDown={ () =>
											setIsResizing( true )
										}
										initial={ {
											opacity: 0,
											left: 0,
										} }
										animate={ {
											opacity: 1,
											left: -15,
										} }
										exit={ {
											opacity: 0,
											left: 0,
										} }
									>
										{ isResizing && ! isEditing && (
											<motion.div
												key="handle-label"
												initial={ {
													opacity: 0,
													x: 20,
												} }
												animate={ {
													opacity: 1,
													x: 0,
												} }
												exit={ {
													opacity: 0,
													x: 20,
												} }
												className="the-frame__handle-label"
											>
												{ frameDevice.label }
											</motion.div>
										) }
									</motion.div>
								),
							} }
							onResizeStop={ ( e, direction, ref, d ) => {
								setFrameWidth( frameWidth + d.width );
							} }
							onResize={ ( e, direction, ref ) => {
								console.log( 'width:', ref.clientWidth );
								const device = devices.find( ( dev ) =>
									dev.width
										? ref.clientWidth < dev.width
										: dev
								);
								setFrameDevice( device );
							} }
							className={ classnames( 'the-frame__inner', {
								edit: isEditing,
								secondary: isListPage,
								resizing: isResizing,
							} ) }
						>
							<motion.div
								className="the-frame__content"
								animate={ {
									borderRadius: isEditing ? 0 : 8,
								} }
								transition={ FRAME_TRANSITION }
							>
								<motion.div
									className="edit-site-layout__header-wrapper"
									initial={ { marginTop: -60 } }
									animate={ {
										marginTop: isEditing ? 0 : -60,
									} }
									transition={ FRAME_TRANSITION }
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
						</ResizableBox>
					</>
				) }
			</motion.div>
			<div
				{ ...navigateRegionsProps }
				ref={ navigateRegionsProps.ref }
				className={ classnames(
					'edit-site-layout',
					navigateRegionsProps.className,
					{
						'is-full-canvas': isFullCanvas,
						'is-edit-mode': isEditing,
					}
				) }
			>
				<AnimatePresence initial={ false }>
					<motion.div
						animate={ {
							opacity: isEditing ? 0.25 : 1,
						} }
						className="edit-site-layout__sidebar"
					>
						<SiteHub className="edit-site-layout__hub" />
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
