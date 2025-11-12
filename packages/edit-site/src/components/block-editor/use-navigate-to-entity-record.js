/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export default function useNavigateToEntityRecord() {
	const history = useHistory();

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			history.navigate(
				`/${ params.postType }/${ params.postId }?canvas=edit&focusMode=true`
			);
		},
		[ history ]
	);

	return onNavigateToEntityRecord;
}
