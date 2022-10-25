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
import { useReducedMotion } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

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
	const isFullCanvas = isEditorPage && canvasMode === 'edit';

	return (
		<>
			<div
				className={ classnames( 'edit-site-layout', {
					'is-full-canvas': isFullCanvas,
				} ) }
			>
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
				</div>
				<AnimatePresence>
					{ ! isFullCanvas && (
						<motion.div
							initial={ { opacity: 0.25, width: 280 } }
							animate={ { opacity: 1, width: 280 } }
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
							<div style={ { width: 280, height: '100%' } }>
								<Sidebar />
							</div>
						</motion.div>
					) }
				</AnimatePresence>
				<motion.div
					className="edit-site-layout__canvas-container"
					animate={ {
						paddingTop: isFullCanvas ? 0 : 24,
						paddingRight: isFullCanvas ? 0 : 24,
						paddingBottom: isFullCanvas ? 0 : 24,
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
			</div>
		</>
	);
}
