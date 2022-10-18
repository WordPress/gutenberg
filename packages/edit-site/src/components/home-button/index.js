/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { home } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useLink } from '../routes/link';
import { useLocation } from '../routes';
import { store as editSiteStore } from '../../store';

export default function HomeButton() {
	const { homeTemplate } = useSelect( ( select ) => {
		const { getSettings } = select( editSiteStore );
		const { __unstableHomeTemplate } = getSettings();

		return {
			homeTemplate: __unstableHomeTemplate,
		};
	}, [] );
	const homeLink = useLink( {
		postId: homeTemplate?.postId,
		postType: homeTemplate?.postType,
	} );
	const { params } = useLocation();
	const isHomePage =
		params.postId === homeTemplate?.postId &&
		params.postType === homeTemplate?.postType;

	if ( ! homeTemplate ) {
		return null;
	}

	return (
		<Button
			{ ...homeLink }
			label={ __( 'Navigate to the home template' ) }
			icon={ home }
			disabled={ isHomePage }
		/>
	);
}
