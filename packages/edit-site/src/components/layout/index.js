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
} from '@wordpress/components';
import {
	useReducedMotion,
	useViewportMatch,
	useResizeObserver,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
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

const ANIMATION_DURATION = 0.5;

export default function Layout( { onError } ) {
	// This ensures the edited entity id and type are initialized properly.
	useInitEditedEntityFromURL();

	const { params } = useLocation();
	const isListPage = getIsListPage( params );
	const isEditorPage = ! isListPage;
	const { canvasMode, previousShortcut, nextShortcut } = useSelect(
		( select ) => {
			const { getAllShortcutKeyCombinations } = select(
				keyboardShortcutsStore
			);
			const { __unstableGetCanvasMode } = select( editSiteStore );
			return {
				canvasMode: __unstableGetCanvasMode(),
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

	const isFullCanvas =
		( isEditorPage && canvasMode === 'edit' && ! isMobileViewport ) ||
		isMobileCanvasVisible;
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

	return (
		<>
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
					className="edit-site-layout__hub"
					isMobileCanvasVisible={ isMobileCanvasVisible }
					setIsMobileCanvasVisible={ setIsMobileCanvasVisible }
				/>

				<AnimatePresence initial={ false }>
					{ isEditorPage &&
						( canvasMode === 'edit' || isMobileCanvasVisible ) && (
							<NavigableRegion
								className="edit-site-layout__header"
								ariaLabel={ __( 'Editor top bar' ) }
								as={ motion.div }
								animate={ {
									y: 0,
								} }
								initial={ {
									y: '-100%',
								} }
								exit={ {
									y: '-100%',
								} }
								transition={ {
									type: 'tween',
									duration: disableMotion
										? 0
										: ANIMATION_DURATION,
									ease: 'easeOut',
								} }
							>
								{ canvasMode === 'edit' && <Header /> }
							</NavigableRegion>
						) }
				</AnimatePresence>

				<div className="edit-site-layout__content">
					<AnimatePresence initial={ false }>
						{ showSidebar && (
							<NavigableRegion
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
									duration: disableMotion
										? 0
										: ANIMATION_DURATION,
									ease: 'easeOut',
								} }
								className="edit-site-layout__sidebar"
								ariaLabel={ __( 'Navigation sidebar' ) }
							>
								<Sidebar />
							</NavigableRegion>
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
												? canvasSize.width -
												  canvasPadding
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
										<ErrorBoundary onError={ onError }>
											{ isEditorPage && <Editor /> }
											{ isListPage && <ListPage /> }
										</ErrorBoundary>
									</motion.div>
								</motion.div>
							) }
						</div>
					) }
				</div>
			</div>
		</>
	);
}
