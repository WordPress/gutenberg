/**
 * Internal dependencies
 */
import history from '../../utils/history';
import getIsListPage from '../../utils/get-is-list-page';

function getNeedsHomepageRedirect( params ) {
	const { postType } = params;
	return (
		! getIsListPage( params ) &&
		! [ 'post', 'page', 'wp_template', 'wp_template_part' ].includes(
			postType
		)
	);
}

export default async function redirectToHomepage( homeTemplate ) {
	const searchParams = new URLSearchParams( history.location.search );
	const params = Object.fromEntries( searchParams.entries() );

	if ( getNeedsHomepageRedirect( params ) ) {
		if ( ! homeTemplate ) {
			throw new Error(
				'`redirectToHomepage`: unable to find home template.'
			);
		}

		history.replace( homeTemplate );
	}
}
