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
import { store as coreStore } from '@wordpress/core-data';
import {
	generateGlobalStyles,
	mergeGlobalStyles,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import useNavigateToEntityRecord from './use-navigate-to-entity-record';
import { FOCUSABLE_ENTITIES } from '../../utils/constants';

const { useLocation, useHistory } = unlock( routerPrivateApis );
const { useGlobalStyles } = unlock( editorPrivateApis );

/**
 * Look up a template's style variation data directly from core-data.
 * Called outside the TemplateStyleVariationProvider context, so it performs
 * its own lookup. When the variation has a wp_global_styles post with user
 * edits, the post data is returned; otherwise registered data is used.
 *
 * @param {string|null} templateId The template ID to look up.
 * @return {Object} Object with variation styles and settings.
 */
function useTemplateStyleVariationLookup( templateId ) {
	return useSelect(
		( select ) => {
			if ( ! templateId ) {
				return {
					variationStyles: null,
					variationSettings: null,
				};
			}

			const { getEditedEntityRecord } = select( coreStore );
			const template = getEditedEntityRecord(
				'postType',
				'wp_template',
				templateId
			);

			const variationId = template?.style_variation || null;

			if ( ! variationId ) {
				return {
					variationStyles: null,
					variationSettings: null,
				};
			}

			// Look up variation data from the registry.
			const getRegisteredVariations =
				select( coreStore ).__experimentalGetRegisteredStyleVariations;
			if ( typeof getRegisteredVariations !== 'function' ) {
				return {
					variationStyles: null,
					variationSettings: null,
				};
			}

			const variations = getRegisteredVariations() || [];
			const variation = variations.find( ( v ) => v.id === variationId );
			if ( ! variation ) {
				return {
					variationStyles: null,
					variationSettings: null,
				};
			}

			// If the variation has a wp_global_styles post, use its
			// (potentially user-edited) data instead of registered defaults.
			if ( variation.post_id ) {
				const postRecord = getEditedEntityRecord(
					'root',
					'globalStyles',
					variation.post_id
				);
				if ( postRecord?.settings || postRecord?.styles ) {
					return {
						variationStyles: postRecord.styles || null,
						variationSettings: postRecord.settings || null,
					};
				}
			}

			// Fall back to registered data.
			return {
				variationStyles: variation.styles || null,
				variationSettings: variation.settings || null,
			};
		},
		[ templateId ]
	);
}

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

export function useSpecificEditorSettings( resolvedTemplateId = null ) {
	const { query } = useLocation();
	const { canvas = 'view' } = query;
	const [ onNavigateToEntityRecord, initialBlockSelection ] =
		useNavigateToEntityRecord();

	/*
	 * Generate global styles directly to avoid circular dependency with GlobalStylesRenderer
	 * (which runs inside ExperimentalEditorProvider after this hook).
	 * GlobalStylesRenderer updates editorStore, but reading from it here would cause infinite
	 * loops. Reading config from useGlobalStyles and generating CSS directly keeps us in sync.
	 * See: https://github.com/WordPress/gutenberg/issues/73350
	 */
	const { merged: mergedConfig } = useGlobalStyles();

	// Look up the template's style variation directly (outside the context provider).
	// This uses post data (user edits) when available, falling back to registered data.
	const { variationStyles, variationSettings } =
		useTemplateStyleVariationLookup( resolvedTemplateId );

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

	// Merge variation styles/settings into the config if a variation is assigned.
	const effectiveMergedConfig = useMemo( () => {
		if ( ! variationStyles && ! variationSettings ) {
			return mergedConfig;
		}
		return mergeGlobalStyles( mergedConfig, {
			styles: variationStyles || {},
			settings: variationSettings || {},
		} );
	}, [ mergedConfig, variationStyles, variationSettings ] );

	const [ globalStyles, globalSettings ] = useMemo( () => {
		return generateGlobalStyles( effectiveMergedConfig, [], {
			disableRootPadding: false,
		} );
	}, [ effectiveMergedConfig ] );

	const defaultEditorSettings = useMemo( () => {
		// Preserve non-global styles from settings.styles (e.g., editor styles from add_editor_style)
		const nonGlobalStyles = ( settings?.styles ?? [] ).filter(
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
			__experimentalFeatures: globalSettings,
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
