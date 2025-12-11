/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { usePrevious } from '@wordpress/compose';
import { store as editorStore } from '@wordpress/editor';

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
	const previousCanvas = usePrevious( location.query.canvas );
	const history = useHistory();
	const goBack = useMemo( () => {
		const isFocusMode =
			location.query.focusMode ||
			( location?.params?.postId &&
				FOCUSABLE_ENTITIES.includes( location?.params?.postType ) );
		const didComeFromEditorCanvas = previousCanvas === 'edit';
		const showBackButton = isFocusMode && didComeFromEditorCanvas;
		return showBackButton ? () => history.back() : undefined;
	}, [ location, history, previousCanvas ] );
	return goBack;
}

export function useSpecificEditorSettings() {
	const { query } = useLocation();
	const { canvas = 'view' } = query;
	const onNavigateToEntityRecord = useNavigateToEntityRecord();
	const { settings, currentPostIsTrashed } = useSelect( ( select ) => {
		const { getSettings } = select( editSiteStore );
		const { getCurrentPostAttribute } = select( editorStore );
		return {
			settings: getSettings(),
			currentPostIsTrashed:
				getCurrentPostAttribute( 'status' ) === 'trash',
		};
	}, [] );

	const onNavigateToPreviousEntityRecord =
		useNavigateToPreviousEntityRecord();

	const defaultEditorSettings = useMemo( () => {
		return {
			...settings,
			styles: [
				...settings.styles,
				{
					// Forming a "block formatting context" to prevent margin collapsing.
					// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
					css:
						canvas === 'view'
							? `body{min-height: 100vh; ${
									currentPostIsTrashed
										? ''
										: 'cursor: pointer;'
							  }}`
							: undefined,
				},
			],
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
		currentPostIsTrashed,
		onNavigateToEntityRecord,
		onNavigateToPreviousEntityRecord,
	] );

	return defaultEditorSettings;
}
