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
} from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';

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
	const disableMotion = useReducedMotion();
	const isFullCanvas = isEditorPage && canvasMode === 'edit';

	// Todo: Bring back the template list to the sidebar.

	return (
		<div
			className={ classnames( 'edit-site-layout', {
				'is-full-canvas': isFullCanvas,
			} ) }
		>
			<AnimatePresence>
				{ ! isFullCanvas && (
					<motion.div
						initial={ { opacity: 0, width: 280 } }
						animate={ { opacity: 1, width: 280 } }
						exit={ {
							opacity: 0,
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
				animate={ { padding: isFullCanvas ? 0 : 24 } }
				transition={ {
					type: 'tween',
					duration: disableMotion ? 0 : 0.5,
				} }
			>
				<motion.div
					className="edit-site-layout__canvas"
					layout={ ! disableMotion }
				>
					<ErrorBoundary>
						{ isEditorPage && <Editor /> }
						{ isListPage && <ListPage /> }
					</ErrorBoundary>
				</motion.div>
			</motion.div>
		</div>
	);
}
