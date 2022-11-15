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
} from '@wordpress/components';
import {
	useReducedMotion,
	useViewportMatch,
	useResizeObserver,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Sidebar } from '../sidebar';
import Editor from '../editor';
import ListPage from '../list';
import ErrorBoundary from '../error-boundary';
import { store as editSiteStore } from '../../store';
import { useLocation } from '../routes';
import getIsListPage from '../../utils/get-is-list-page';
import SiteIconAndTitle from '../site-icon-and-title';
import Header from '../header-edit-mode';

const ANIMATION_DURATION = 3.3;

export default function Layout() {
	const { params } = useLocation();
	const isListPage = getIsListPage( params );
	const isEditorPage = ! isListPage;
	const { canvasMode } = useSelect(
		( select ) => ( {
			canvasMode: select( editSiteStore ).__unstableGetCanvasMode(),
		} ),
		[]
	);
	const { __unstableSetCanvasMode } = useDispatch( editSiteStore );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const disableMotion = useReducedMotion();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ isMobileCanvasVisible, setIsMobileCanvasVisible ] =
		useState( false );
	const canvasPadding = isMobileViewport ? 0 : 24;
	const showSidebar =
		( isMobileViewport && ! isMobileCanvasVisible ) ||
		( ! isMobileViewport && ( canvasMode === 'view' || ! isEditorPage ) );
	const showCanvas =
		( isMobileViewport && isMobileCanvasVisible ) || ! isMobileViewport;
	// Ideally this effect could be removed if we move the "isMobileCanvasVisible" into the store.
	const [ canvasResizer, canvasSize ] = useResizeObserver();
	const [ fullResizer, fullSize ] = useResizeObserver();
	useEffect( () => {
		if ( canvasMode === 'view' && isMobileViewport ) {
			setIsMobileCanvasVisible( false );
		}

		if ( canvasMode === 'edit' && isMobileViewport ) {
			setIsMobileCanvasVisible( true );
		}
	}, [ canvasMode, isMobileViewport ] );
	const showFrame =
		! isEditorPage || ( canvasMode === 'view' && ! isMobileViewport );

	return (
		<>
			{ fullResizer }
			<div
				className={ classnames( 'edit-site-layout', {
					'is-full-canvas': isEditorPage && canvasMode === 'edit',
				} ) }
			>
				<div className="edit-site-layout__header">
					<div className="edit-site-layout__logo">
						{ ( ( ! isMobileViewport && canvasMode === 'view' ) ||
							( isMobileViewport &&
								! isMobileCanvasVisible ) ) && (
							<Button
								href="index.php"
								aria-label={ __( 'Go back to the dashboard' ) }
							>
								<SiteIconAndTitle />
							</Button>
						) }
						{ ( ( isMobileViewport && isMobileCanvasVisible ) ||
							( ! isMobileViewport &&
								canvasMode === 'edit' ) ) && (
							<Button
								className="edit-site-layout__view-mode-toggle"
								label={ __( 'Open Navigation Sidebar' ) }
								onClick={ () => {
									clearSelectedBlock();
									setIsMobileCanvasVisible( false );
									__unstableSetCanvasMode( 'view' );
								} }
							>
								<SiteIconAndTitle
									className="edit-site-layout__view-mode-toggle-icon"
									showTitle={ false }
								/>
							</Button>
						) }
						{ isEditorPage &&
							( ( ! isMobileViewport && canvasMode === 'view' ) ||
								( isMobileViewport &&
									canvasMode === 'view' &&
									isMobileCanvasVisible ) ) && (
								<Button
									className="edit-site-layout__edit-button"
									label={ __( 'Open the editor' ) }
									onClick={ () => {
										__unstableSetCanvasMode( 'edit' );
									} }
								>
									{ __( 'Edit' ) }
								</Button>
							) }

						{ isMobileViewport && ! isMobileCanvasVisible && (
							<Button
								onClick={ () =>
									setIsMobileCanvasVisible( true )
								}
							>
								{ __( 'View Editor' ) }
							</Button>
						) }
					</div>
					<AnimatePresence>
						{ isEditorPage && canvasMode === 'edit' && (
							<motion.div
								initial={ { y: -60 } }
								animate={ { y: 0 } }
								exit={ {
									y: -60,
									position: 'fixed',
									right: 0,
									left: 60,
								} }
								style={ { flexGrow: '1' } }
								transition={ {
									type: 'tween',
									duration: disableMotion
										? 0
										: ANIMATION_DURATION,
									ease: 'easeOut',
								} }
							>
								<Header />
							</motion.div>
						) }
					</AnimatePresence>
				</div>

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
								duration: disableMotion
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

				{ showCanvas && (
					<div
						className="edit-site-layout__canvas-container"
						style={ {
							paddingTop: showFrame ? canvasPadding : 0,
							paddingBottom: showFrame ? canvasPadding : 0,
						} }
					>
						{ canvasResizer }
						{ !! canvasSize.width && (
							<motion.div
								initial={ false }
								layout="position"
								className="edit-site-layout__canvas"
								animate={ {
									width: showFrame
										? canvasSize.width - canvasPadding
										: fullSize.width,
									bottom: showFrame ? canvasPadding : 0,
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
									{ isEditorPage && <Editor /> }
									{ isListPage && <ListPage /> }
								</ErrorBoundary>
							</motion.div>
						) }
					</div>
				) }
			</div>
		</>
	);
}
