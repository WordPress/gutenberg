/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useHistory } from '../routes';
import { store as editSiteStore } from '../../store';

export default function HomepageRedirect() {
	const params = useSelect(
		( select ) => select( editSiteStore ).getHomepageParams(),
		[]
	);

	const history = useHistory();

	if ( params ) {
		history.replace( params );
	}

	// TODO - a loading state might be an option here.
	return null;
}
