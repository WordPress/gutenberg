/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import useNavigateToEntityRecord from './use-navigate-to-entity-record';
import { FOCUSABLE_ENTITIES } from '../../utils/constants';

const { useLocation, useHistory } = unlock( routerPrivateApis );

function useNavigateToPreviousEntityRecord() {
	const location = useLocation();
	const previousLocation = usePrevious( location );
	const history = useHistory();
	const goBack = useMemo( () => {
		const isFocusMode =
			location.query.focusMode ||
			( location?.params?.postId &&
				FOCUSABLE_ENTITIES.includes( location?.params?.postType ) );
		const didComeFromEditorCanvas =
			previousLocation?.query.canvas === 'edit';
		const showBackButton = isFocusMode && didComeFromEditorCanvas;
		return showBackButton ? () => history.back() : undefined;
		// `previousLocation` changes when the component updates for any reason, not
		// just when location changes. Until this is fixed we can't add it to deps. See
		// https://github.com/WordPress/gutenberg/pull/58710#discussion_r1479219465.
	}, [ location, history ] );
	return goBack;
}

export function useSpecificEditorSettings() {
	const { query } = useLocation();
	const { canvas = 'view' } = query;
	const onNavigateToEntityRecord = useNavigateToEntityRecord();
	const { settings } = useSelect( ( select ) => {
		const { getSettings } = select( editSiteStore );
		return {
			settings: getSettings(),
		};
	}, [] );

	const onNavigateToPreviousEntityRecord =
		useNavigateToPreviousEntityRecord();
	const defaultEditorSettings = useMemo( () => {
		return {
			...settings,

			richEditingEnabled: true,
			supportsTemplateMode: true,
			focusMode: canvas !== 'view',
			onNavigateToEntityRecord,
			onNavigateToPreviousEntityRecord,
			isPreviewMode: canvas === 'view',
		};
	}, [
		settings,
		canvas,
		onNavigateToEntityRecord,
		onNavigateToPreviousEntityRecord,
	] );

	return defaultEditorSettings;
}
