/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { buildWidgetAreasPostId, KIND, POST_TYPE } from '../store/utils';

const useLastSelectedRootId = () => {
	const firstRootId = useSelect( ( select ) => {
		// Default to the first widget area
		const { getEntityRecord } = select( 'core' );
		const widgetAreasPost = getEntityRecord(
			KIND,
			POST_TYPE,
			buildWidgetAreasPostId()
		);
		if ( widgetAreasPost ) {
			return widgetAreasPost?.blocks[ 0 ]?.clientId;
		}
	}, [] );

	const lastSelectedRootIdRef = useRef();
	if ( ! lastSelectedRootIdRef.current && firstRootId ) {
		lastSelectedRootIdRef.current = firstRootId;
	}

	const selectedRootId = useSelect( ( select ) => {
		const { getBlockRootClientId, getBlockSelectionEnd } = select(
			'core/block-editor'
		);
		return getBlockRootClientId( getBlockSelectionEnd() );
	}, [] );

	if ( selectedRootId ) {
		lastSelectedRootIdRef.current = selectedRootId;
	}

	return lastSelectedRootIdRef.current;
};

export default useLastSelectedRootId;
