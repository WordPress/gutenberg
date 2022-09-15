/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __unstableMotion as motion } from '@wordpress/components';
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
			<div className="edit-site-layout__sidebar">
				<Sidebar />
			</div>
			<div className="edit-site-layout__canvas-container">
				<motion.div
					className="edit-site-layout__canvas"
					layout={ ! disableMotion }
				>
					<ErrorBoundary>
						{ isEditorPage && <Editor /> }
						{ isListPage && <ListPage /> }
					</ErrorBoundary>
				</motion.div>
			</div>
		</div>
	);
}
