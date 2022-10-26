/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
	Button,
} from '@wordpress/components';
import { useReducedMotion, useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useState, useEffect, useRef } from '@wordpress/element';

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
	const isFullCanvas = isEditorPage && canvasMode === 'edit';
	const canvasPadding = isMobileViewport ? 0 : 24;
	const sidebarWidth = isMobileViewport ? '100%' : 280;
	const showSidebar =
		( isMobileViewport && ! isMobileCanvasVisible ) ||
		( ! isMobileViewport && ! isFullCanvas );
	const showCanvas =
		( isMobileViewport && isMobileCanvasVisible ) || ! isMobileViewport;
	const showLogo =
		( isMobileViewport && ! isMobileCanvasVisible ) ||
		! isMobileViewport ||
		canvasMode === 'edit';
	// Ideally this effect could be removed if we move the "isMobileCanvasVisible" into the store.
	useEffect( () => {
		if ( canvasMode === 'view' && isMobileViewport ) {
			setIsMobileCanvasVisible( false );
		}
	}, [ canvasMode, isMobileViewport ] );
	const initialRendering = useRef( true );
	useEffect( () => {
		initialRendering.current = false;
	}, [] );

	return (
		<>
			<div
				className={ classnames( 'edit-site-layout', {
					'is-full-canvas': isFullCanvas,
				} ) }
			>
				{ showLogo && (
					<div className="edit-site-layout__logo">
						{ isFullCanvas && (
							<Button
								className="edit-site-layout__view-mode-toggle"
								label={ __( 'Open Navigation Sidebar' ) }
								onClick={ () => {
									clearSelectedBlock();
									__unstableSetCanvasMode( 'view' );
								} }
							>
								<SiteIconAndTitle
									className="edit-site-layout__view-mode-toggle-icon"
									showTitle={ false }
								/>
							</Button>
						) }
						{ ! isFullCanvas && (
							<Button
								href="index.php"
								aria-label={ __( 'Go back to the dashboard' ) }
							>
								<SiteIconAndTitle />
							</Button>
						) }

						{ canvasMode === 'view' && isMobileViewport && (
							<Button
								onClick={ () =>
									setIsMobileCanvasVisible( true )
								}
							>
								{ __( 'View Editor' ) }
							</Button>
						) }
					</div>
				) }
				<AnimatePresence>
					{ showSidebar && (
						<motion.div
							initial={ {
								opacity: 0.25,
								width: initialRendering.current
									? sidebarWidth
									: 0,
							} }
							animate={ { opacity: 1, width: sidebarWidth } }
							exit={ {
								opacity: 0.25,
								width: 0,
							} }
							transition={ {
								type: 'tween',
								duration: disableMotion ? 0 : 0.5,
							} }
							className="edit-site-layout__sidebar"
						>
							<div
								style={ {
									width: sidebarWidth,
									height: '100%',
								} }
							>
								<Sidebar />
							</div>
						</motion.div>
					) }
				</AnimatePresence>
				<AnimatePresence>
					{ showCanvas && (
						<motion.div
							className="edit-site-layout__canvas-container"
							animate={ {
								paddingTop: isFullCanvas ? 0 : canvasPadding,
								paddingRight: isFullCanvas ? 0 : canvasPadding,
								paddingBottom: isFullCanvas ? 0 : canvasPadding,
								opacity: 1,
							} }
							exit={ {
								opacity: 0.25,
							} }
							transition={ {
								type: 'tween',
								duration: disableMotion ? 0 : 0.5,
							} }
						>
							<motion.div
								className="edit-site-layout__canvas"
								layout
								transition={ {
									type: 'tween',
									duration: disableMotion ? 0 : 0.5,
								} }
							>
								<ErrorBoundary>
									{ isEditorPage && <Editor /> }
									{ isListPage && <ListPage /> }
								</ErrorBoundary>
							</motion.div>
						</motion.div>
					) }
				</AnimatePresence>
			</div>
		</>
	);
}
