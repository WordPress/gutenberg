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
import {
	useState,
	useRef,
	useEffect,
	useLayoutEffect,
} from '@wordpress/element';
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

const ANIMATION_DURATION = 0.2;

const SIDEBAR_DEFAULT_WIDTH = 360;
const SMALL_FRAME_SIZE = 240;

const frameVariants = {
	hovering: {
		top: 8,
		bottom: 8,
		left: SIDEBAR_DEFAULT_WIDTH + 16,
		right: 16,
	},
	edit: {
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		borderRadius: 0,
		transition: { bounce: 0.2 },
	},
	primary: {
		top: 16,
		bottom: 16,
		left: SIDEBAR_DEFAULT_WIDTH + 16,
		right: 16,
		transition: { bounce: 0.2 },
	},
};

const devices = [
	{
		label: 'Mobile',
		width: 480,
	},
	{
		label: 'Tablet',
		width: 768,
	},
	{
		label: 'Desktop',
		width: null,
	},
];

export default function Layout() {
	// This ensures the edited entity id and type are initialized properly.
	useInitEditedEntityFromURL();
	useSyncCanvasModeWithURL();

	const hubRef = useRef();
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
	const [ isResizing, setIsResizing ] = useState( false );
	const [ isHovering, setIsHovering ] = useState( false );
	const [ frameWidth, setFrameWidth ] = useState( 0 );

	const x = useMotionValue( 0 );

	const [ fullResizer, { height: fullHeight, width: fullWidth } ] =
		useResizeObserver();

	useEffect( () => {
		if ( fullWidth ) {
			return x.onChange( ( latest ) => {
				setFrameWidth(
					fullWidth - SIDEBAR_DEFAULT_WIDTH - 32 - latest * 2
				);
			} );
		}
	}, [ fullWidth ] );

	useEffect( () => {
		if ( canvasMode === 'edit' ) {
			x.set( 0 );
		}
	}, [ canvasMode ] );

	const frameAnimate =
		canvasMode === 'edit' ? 'edit' : isHovering ? 'hovering' : 'primary';

	// Synchronizing the URL with the store value of canvasMode happens in an effect
	// This condition ensures the component is only rendered after the synchronization happens
	// which prevents any animations due to potential canvasMode value change.
	if ( canvasMode === 'init' ) {
		return null;
	}

	const { label } = devices.find(
		( device ) => frameWidth <= device.width || device.width === null
	);

	return (
		<>
			<KeyboardShortcutsRegister />
			<KeyboardShortcutsGlobal />
			{ fullResizer }

			<motion.div
				variants={ frameVariants }
				initial={ canvasMode === 'edit' ? 'edit' : 'primary' }
				animate={ frameAnimate }
				ref={ frameRef }
				onMouseOver={ () => setIsHovering( true ) }
				onMouseOut={ () => setIsHovering( false ) }
				className={ classnames( 'the-frame', {
					edit: canvasMode === 'edit',
					secondary: isListPage,
					resizing: isResizing,
				} ) }
			>
				{ !! fullResizer && (
					<div>
						<AnimatePresence>
							{ ( isHovering || isResizing ) && (
								<motion.div
									key="handle"
									className="the-frame__handle"
									title="drag to resize"
									dragMomentum={ false }
									drag="x"
									onDragStart={ () => setIsResizing( true ) }
									onDragEnd={ () => setIsResizing( false ) }
									style={ { x } }
									initial={ {
										opacity: 0,
										left: 0,
										y: '-50%',
									} }
									animate={ {
										opacity: 1,
										left: -15,
										y: '-50%',
									} }
									exit={ {
										opacity: 0,
										left: 0,
										y: '-50%',
									} }
									dragConstraints={ {
										left: 0,
										right:
											( fullWidth -
												SIDEBAR_DEFAULT_WIDTH -
												16 -
												SMALL_FRAME_SIZE ) /
											2,
									} }
								>
									{ isResizing && (
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
											{ label }
										</motion.div>
									) }
								</motion.div>
							) }
						</AnimatePresence>
						<div className="the-frame__devices">
							{ devices.map( ( device ) => (
								<div
									className="the-frame__device"
									key={ device.label }
									style={ { width: device.width } }
								/>
							) ) }
						</div>
						<motion.div
							style={ {
								left: x,
								right: x,
							} }
							className="the-frame__inner"
						>
							<motion.div
								className="edit-site-layout__header-wrapper"
								initial={ { marginTop: -60 } }
								animate={ {
									marginTop: canvasMode === 'edit' ? 0 : -60,
								} }
								transition={ { bounce: 0.2 } }
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
					</div>
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
