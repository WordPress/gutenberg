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
import { useReducedMotion, useViewportMatch } from '@wordpress/compose';
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

	return (
		<>
			<div
				className={ classnames( 'edit-site-layout', {
					'is-full-canvas': isFullCanvas,
				} ) }
			>
				<div className="edit-site-layout__header">
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
									aria-label={ __(
										'Go back to the dashboard'
									) }
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
						{ isFullCanvas && (
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
									duration: disableMotion ? 0 : 0.5,
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
								duration: disableMotion ? 0 : 0.5,
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
							paddingTop:
								isFullCanvas || isEditorPage
									? 0
									: canvasPadding,
							paddingRight:
								isFullCanvas || isEditorPage
									? 0
									: canvasPadding,
							paddingBottom:
								isFullCanvas || isEditorPage
									? 0
									: canvasPadding,
						} }
					>
						<motion.div
							layout
							className="edit-site-layout__canvas"
							animate={ {
								scale:
									! isFullCanvas && isEditorPage ? 0.95 : 1,
							} }
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
					</div>
				) }
			</div>
		</>
	);
}
