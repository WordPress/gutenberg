/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getPostLinkProps } from '../routes/link';

const { useHistory } = unlock( routerPrivateApis );

export function useChangeEntity() {
	// When moving from a page to edit its template we need to track this as history
	// so that the back button displays in the docuement bar the same as in the post
	// editor.
	const [ hasHistory, setHasHistory ] = useState( false );
	const history = useHistory();

	const getEntityLoader = ( params, state ) => {
		const { href, onClick } = getPostLinkProps( history, params, state );

		return {
			href,
			loadEntity: ( event ) => {
				event?.preventDefault();
				if ( params.postType === 'wp_template' ) {
					setHasHistory( true );
				}
				onClick( event );
			},
		};
	};

	const handleOnBack = () => {
		setHasHistory( false );
		history.back();
	};

	return {
		getEntityLoader,
		hasHistory,
		goBack: handleOnBack,
	};
}
