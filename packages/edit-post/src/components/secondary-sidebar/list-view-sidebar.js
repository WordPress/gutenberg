/**
 * WordPress dependencies
 */
import { __experimentalListView as ListView } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import {
	useFocusOnMount,
	useFocusReturn,
	useInstanceId,
	useMergeRefs,
} from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { ESCAPE } from '@wordpress/keycodes';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export default function ListViewSidebar() {
	const { setIsListViewOpened } = useDispatch( editPostStore );

	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const headerFocusReturnRef = useFocusReturn();
	const contentFocusReturnRef = useFocusReturn();
	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			setIsListViewOpened( false );
		}
	}

	const instanceId = useInstanceId( ListViewSidebar );
	const labelId = `edit-post-editor__list-view-panel-label-${ instanceId }`;

	const { documentLabel, isTemplateMode } = useSelect( ( select ) => {
		const postTypeLabel = select( editorStore ).getPostTypeLabel();

		return {
			// translators: Default label for the document in the list view description.
			documentLabel: postTypeLabel || _x( 'document', 'noun' ),
			isTemplateMode: select( editPostStore ).isEditingTemplate(),
		};
	}, [] );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			aria-labelledby={ labelId }
			className="edit-post-editor__list-view-panel"
			onKeyDown={ closeOnEscape }
		>
			<div
				className="edit-post-editor__list-view-panel-header"
				ref={ headerFocusReturnRef }
			>
				<div>
					<strong id={ labelId }>{ __( 'List View' ) }</strong>

					<p>
						{ sprintf(
							// translators: List view description. %s: Document label.
							__(
								'Manage and reorder blocks and groups of blocks used in your %s.'
							),
							isTemplateMode
								? _x( 'template', 'noun' )
								: documentLabel.toLowerCase()
						) }
					</p>
				</div>
				<Button
					icon={ closeSmall }
					label={ __( 'Close List View Sidebar' ) }
					onClick={ () => setIsListViewOpened( false ) }
				/>
			</div>
			<div
				className="edit-post-editor__list-view-panel-content"
				ref={ useMergeRefs( [
					contentFocusReturnRef,
					focusOnMountRef,
				] ) }
			>
				<ListView />
			</div>
		</div>
	);
}
