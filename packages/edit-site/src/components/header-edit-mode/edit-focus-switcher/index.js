/**
 * WordPress dependencies
 */
import { TabPanel } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityRecord } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import useEditedEntityRecord from '../../use-edited-entity-record';

// TODO: 'edit focus' could be confused with 'editor mode'
export default function EditFocusSwitcher() {
	const { postType, postId } = useSelect(
		( select ) => select( editSiteStore ).getEditedPostContext(),
		[]
	);
	const { hasResolved: hasPostResolved, editedRecord: post } =
		useEntityRecord( 'postType', postType, postId );
	const { isLoaded: isTemplateLoaded } = useEditedEntityRecord();

	const { setEditFocus } = useDispatch( editSiteStore );

	if ( ! hasPostResolved && ! isTemplateLoaded ) {
		return;
	}

	return (
		<TabPanel
			tabs={ [
				{
					name: 'post',
					title: post.type,
				},
				{
					name: 'template',
					title: 'template',
				},
			] }
			onSelect={ setEditFocus }
		>
			{ () => {} }
		</TabPanel>
	);
}
