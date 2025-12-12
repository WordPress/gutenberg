/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { usePrevious } from '@wordpress/compose';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { getBlockTypes } from '@wordpress/blocks';
import { generateGlobalStyles } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import useNavigateToEntityRecord from './use-navigate-to-entity-record';
import { FOCUSABLE_ENTITIES } from '../../utils/constants';

const { useLocation, useHistory } = unlock( routerPrivateApis );
const { useGlobalStyles } = unlock( editorPrivateApis );

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
	const [ onNavigateToEntityRecord, initialBlockSelection ] =
		useNavigateToEntityRecord();


	// Get merged global styles config and generate styles directly
	// This avoids reading from editorStore which causes infinite loops
	const { merged: mergedConfig } = useGlobalStyles();
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

	// Generate global styles from merged config.
	const [ globalStyles, globalSettings ] = useMemo( () => {
		if ( ! mergedConfig?.styles || ! mergedConfig?.settings ) {
			return [ [], {} ];
		}

		const blockTypes = getBlockTypes();
		return generateGlobalStyles( mergedConfig, blockTypes, {
			disableRootPadding: false,
		} );
	}, [ mergedConfig ] );

	const defaultEditorSettings = useMemo( () => {
		// Filter out global styles from base settings and merge with generated global styles
		const nonGlobalStyles = ( settings.styles ?? [] ).filter(
			( style ) => ! style.isGlobalStyles
		);
		return {
			...settings,
			styles: [
				...nonGlobalStyles,
				...globalStyles,
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
			__experimentalFeatures:
				globalSettings || settings.__experimentalFeatures,
			richEditingEnabled: true,
			supportsTemplateMode: true,
			focusMode: canvas !== 'view',
			onNavigateToEntityRecord,
			onNavigateToPreviousEntityRecord,
			isPreviewMode: canvas === 'view',
			initialBlockSelection,
		};
	}, [
		settings,
		globalStyles,
		globalSettings,
		canvas,
		currentPostIsTrashed,
		onNavigateToEntityRecord,
		onNavigateToPreviousEntityRecord,
		initialBlockSelection,
	] );

	return defaultEditorSettings;
}
