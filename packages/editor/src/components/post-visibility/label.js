/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { useTranslate } from '@wordpress/react-i18n';

export const usePostVisibilityOptions = () => {
	const { __ } = useTranslate();

	return [
		{
			value: 'public',
			label: __( 'Public' ),
			info: __( 'Visible to everyone.' ),
		},
		{
			value: 'private',
			label: __( 'Private' ),
			info: __( 'Only visible to site admins and editors.' ),
		},
		{
			value: 'password',
			label: __( 'Password Protected' ),
			info: __(
				'Protected with a password you choose. Only those with the password can view this post.'
			),
		},
	];
};

function PostVisibilityLabel( { visibility } ) {
	const visibilityOptions = usePostVisibilityOptions();

	return find( visibilityOptions, { value: visibility } ).label;
}

export default withSelect( ( select ) => ( {
	visibility: select( 'core/editor' ).getEditedPostVisibility(),
} ) )( PostVisibilityLabel );
