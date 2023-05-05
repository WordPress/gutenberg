/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import {
	useFocusOnMount,
	useFocusReturn,
	useMergeRefs,
} from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../private-apis';

export default function ListViewSidebar() {
	const { setIsListViewOpened } = useDispatch( editSiteStore );

	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const headerFocusReturnRef = useFocusReturn();
	const contentFocusReturnRef = useFocusReturn();
	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			setIsListViewOpened( false );
		}
	}

	const { PrivateListView } = unlock( blockEditorPrivateApis );
	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="edit-site-editor__list-view-panel"
			onKeyDown={ closeOnEscape }
		>
			<div
				className="edit-site-editor__list-view-panel-header"
				ref={ headerFocusReturnRef }
			>
				<strong>{ __( 'List View' ) }</strong>
				<Button
					icon={ closeSmall }
					label={ __( 'Close' ) }
					onClick={ () => setIsListViewOpened( false ) }
				/>
			</div>
			<div
				className="edit-site-editor__list-view-panel-content"
				ref={ useMergeRefs( [
					contentFocusReturnRef,
					focusOnMountRef,
				] ) }
			>
				<PrivateListView />
			</div>
		</div>
	);
}
