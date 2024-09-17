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
			location.params.focusMode ||
			( location.params.postId &&
				FOCUSABLE_ENTITIES.includes( location.params.postType ) );
		const didComeFromEditorCanvas =
			previousLocation?.params.canvas === 'edit';
		const showBackButton = isFocusMode && didComeFromEditorCanvas;
		return showBackButton ? () => history.back() : undefined;
		// Disable reason: previousLocation changes when the component updates for any reason, not
		// just when location changes. Until this is fixed we can't add it to deps. See
		// https://github.com/WordPress/gutenberg/pull/58710#discussion_r1479219465.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ location, history ] );
	return goBack;
}

export function useSpecificEditorSettings() {
	const onNavigateToEntityRecord = useNavigateToEntityRecord();
	const { canvasMode, settings, shouldUseTemplateAsDefaultRenderingMode } =
		useSelect( ( select ) => {
			const { getEditedPostContext, getCanvasMode, getSettings } = unlock(
				select( editSiteStore )
			);
			const _context = getEditedPostContext();
			return {
				canvasMode: getCanvasMode(),
				settings: getSettings(),
				// TODO: The `postType` check should be removed when the default rendering mode per post type is merged.
				// @see https://github.com/WordPress/gutenberg/pull/62304/
				shouldUseTemplateAsDefaultRenderingMode:
					_context?.postId && _context?.postType !== 'post',
			};
		}, [] );
	const defaultRenderingMode = shouldUseTemplateAsDefaultRenderingMode
		? 'template-locked'
		: 'post-only';
	const onNavigateToPreviousEntityRecord =
		useNavigateToPreviousEntityRecord();
	const defaultEditorSettings = useMemo( () => {
		return {
			...settings,

			richEditingEnabled: true,
			supportsTemplateMode: true,
			focusMode: canvasMode !== 'view',
			defaultRenderingMode,
			onNavigateToEntityRecord,
			onNavigateToPreviousEntityRecord,
			__unstableIsPreviewMode: canvasMode === 'view',
		};
	}, [
		settings,
		canvasMode,
		defaultRenderingMode,
		onNavigateToEntityRecord,
		onNavigateToPreviousEntityRecord,
	] );

	return defaultEditorSettings;
}
