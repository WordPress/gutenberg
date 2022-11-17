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
	__experimentalHStack as HStack,
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
import { NavigableRegion } from '@wordpress/interface';

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

const ANIMATION_DURATION = 0.5;

export default function Layout() {
	const { params } = useLocation();
	const isListPage = getIsListPage( params );
	const isEditorPage = ! isListPage;
	const { canvasMode, dashboardLink } = useSelect(
		( select ) => ( {
			canvasMode: select( editSiteStore ).__unstableGetCanvasMode(),
			dashboardLink:
				select( editSiteStore ).getSettings()
					.__experimentalDashboardLink,
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
	const showFrame =
		! isEditorPage || ( canvasMode === 'view' && ! isMobileViewport );
	const showEditButton =
		isEditorPage &&
		isMobileViewport &&
		canvasMode === 'view' &&
		isMobileCanvasVisible;
	const isBackToDashboardButton =
		( ! isMobileViewport && canvasMode === 'view' ) ||
		( isMobileViewport && ! isMobileCanvasVisible );
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
	const siteIconButtonProps = isBackToDashboardButton
		? {
				href: dashboardLink || 'index.php',
				'aria-label': __( 'Go back to the dashboard' ),
		  }
		: {
				label: __( 'Open Navigation Sidebar' ),
				onClick: () => {
					clearSelectedBlock();
					setIsMobileCanvasVisible( false );
					__unstableSetCanvasMode( 'view' );
				},
		  };

	return (
		<>
			{ fullResizer }
			<div
				className={ classnames( 'edit-site-layout', {
					'is-full-canvas':
						( isEditorPage &&
							canvasMode === 'edit' &&
							! isMobileViewport ) ||
						isMobileCanvasVisible,
				} ) }
			>
				<div className="edit-site-layout__header">
					<div className="edit-site-layout__logo">
						<Button
							{ ...siteIconButtonProps }
							className="edit-site-layout__view-mode-toggle"
						>
							<SiteIconAndTitle
								className="edit-site-layout__view-mode-toggle-icon"
								showTitle={ false }
							/>
						</Button>
						<AnimatePresence initial={ false }>
							{ ( isBackToDashboardButton || showEditButton ) && (
								<motion.div
									initial={ { opacity: 0 } }
									exit={ { opacity: 0 } }
									animate={ { opacity: 1 } }
									style={ {
										position: 'absolute',
										left: 60,
									} }
								>
									<HStack>
										{ isBackToDashboardButton && (
											<SiteIconAndTitle
												showIcon={ false }
											/>
										) }

										{ showEditButton && (
											<Button
												className="edit-site-layout__edit-button"
												label={ __(
													'Open the editor'
												) }
												onClick={ () => {
													__unstableSetCanvasMode(
														'edit'
													);
												} }
											>
												{ __( 'Edit' ) }
											</Button>
										) }
									</HStack>
								</motion.div>
							) }
						</AnimatePresence>

						{ isMobileViewport && ! isMobileCanvasVisible && (
							<Button
								onClick={ () =>
									setIsMobileCanvasVisible( true )
								}
								style={ { position: 'fixed', right: 0 } }
							>
								{ __( 'View Editor' ) }
							</Button>
						) }
					</div>
					<AnimatePresence>
						{ isEditorPage && canvasMode === 'edit' && (
							<NavigableRegion
								as={ motion.div }
								initial={ { y: -60 } }
								animate={ { y: 0 } }
								edit={ { y: -60 } }
								transition={ {
									type: 'tween',
									duration: disableMotion
										? 0
										: ANIMATION_DURATION,
									ease: 'easeOut',
								} }
								className="edit-site-layout__editor-header"
								ariaLabel={ __( 'Editor top bar' ) }
							>
								<Header />
							</NavigableRegion>
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
								transition={ {
									type: 'tween',
									duration: disableMotion
										? 0
										: ANIMATION_DURATION,
									ease: 'easeOut',
								} }
							>
								<motion.div
									style={ {
										position: 'absolute',
										top: 0,
										left: 0,
										bottom: 0,
									} }
									initial={ false }
									animate={ {
										width: showFrame
											? canvasSize.width - canvasPadding
											: fullSize.width,
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
							</motion.div>
						) }
					</div>
				) }
			</div>
		</>
	);
}
