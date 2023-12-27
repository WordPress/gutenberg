/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import {
	useAllowSwitchingTemplates,
	useCurrentTemplateSlug,
	useEditedPostContext,
} from './hooks';

export default function ResetDefaultTemplate( { onClick } ) {
	const currentTemplateSlug = useCurrentTemplateSlug();
	const allowSwitchingTemplate = useAllowSwitchingTemplates();
	const { postType, postId } = useEditedPostContext();
	const { editEntityRecord } = useDispatch( coreStore );
	// The default template in a post is indicated by an empty string.
	if ( ! currentTemplateSlug || ! allowSwitchingTemplate ) {
		return null;
	}
	return (
		<MenuItem
			onClick={ () => {
				editEntityRecord(
					'postType',
					postType,
					postId,
					{ template: '' },
					{ undoIgnore: true }
				);
				onClick();
			} }
		>
			{ __( 'Use default template' ) }
		</MenuItem>
	);
}
