/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalHStack as HStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { parse } from '@wordpress/blocks';
import { BlockPreview } from '@wordpress/block-editor';
import {
	EditorProvider,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import {
	privateApis as corePrivateApis,
	store as coreStore,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	mergeGlobalStyles,
	generateGlobalStyles,
} from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { useAddedBy } from './hooks';
import { useDefaultTemplateTypes } from '../add-new-template/utils';
import usePatternSettings from '../page-patterns/use-pattern-settings';
import { unlock } from '../../lock-unlock';

const { Badge } = unlock( componentsPrivateApis );
const { useEntityRecordsWithPermissions } = unlock( corePrivateApis );
const { useStyle, useGlobalStyles } = unlock( editorPrivateApis );

/**
 * Hook to get pattern settings with optional style variation override.
 *
 * When a template has an associated style variation, this hook merges the
 * variation's styles with the base theme styles to generate the correct
 * preview styles. If the variation has been edited (has a wp_global_styles post),
 * it uses the post's styles; otherwise it uses the registered variation's styles.
 *
 * @param {string|null} styleVariationId The style variation ID, or null for default.
 * @return {Object} Settings object for EditorProvider.
 */
function usePatternSettingsWithVariation( styleVariationId ) {
	const basePatternSettings = usePatternSettings();
	const { base: baseConfig } = useGlobalStyles();

	// Get registered variation to find its post_id (if any).
	const registeredVariation = useSelect(
		( select ) => {
			if ( ! styleVariationId ) {
				return null;
			}

			const getRegisteredVariations =
				select( coreStore ).__experimentalGetRegisteredStyleVariations;
			if ( typeof getRegisteredVariations !== 'function' ) {
				return null;
			}

			const variations = getRegisteredVariations() || [];
			return (
				variations.find( ( v ) => v.id === styleVariationId ) || null
			);
		},
		[ styleVariationId ]
	);

	// If the variation has a post, fetch the post's styles (edited version).
	const variationPostData = useSelect(
		( select ) => {
			const postId = registeredVariation?.post_id;
			if ( ! postId ) {
				return null;
			}

			const { getEntityRecord } = select( coreStore );
			const record = getEntityRecord( 'root', 'globalStyles', postId );

			if ( ! record ) {
				return null;
			}

			return {
				settings: record.settings || {},
				styles: record.styles || {},
			};
		},
		[ registeredVariation?.post_id ]
	);

	// Use post data if available, otherwise fall back to registered variation data.
	const effectiveVariationData = useMemo( () => {
		// Priority 1: Use edited post data if it exists.
		if ( variationPostData ) {
			return variationPostData;
		}
		// Priority 2: Use registered variation data.
		if ( registeredVariation ) {
			return {
				settings: registeredVariation.settings || {},
				styles: registeredVariation.styles || {},
			};
		}
		return null;
	}, [ variationPostData, registeredVariation ] );

	// If we have variation data, merge it with base and generate new styles.
	const settings = useMemo( () => {
		if ( ! effectiveVariationData ) {
			return basePatternSettings;
		}

		// Merge variation styles with base theme styles.
		const mergedConfig = mergeGlobalStyles(
			baseConfig || {},
			effectiveVariationData
		);

		// Generate CSS from merged config.
		const [ globalStyles, globalSettings ] = generateGlobalStyles(
			mergedConfig,
			[],
			{ disableRootPadding: false }
		);

		return {
			...basePatternSettings,
			styles: globalStyles,
			__experimentalFeatures: globalSettings,
		};
	}, [ basePatternSettings, effectiveVariationData, baseConfig ] );

	return settings;
}

/**
 * Hook to get the background color for a template preview.
 *
 * When a template has a style variation, returns the variation's background color.
 * If the variation has been edited (has a post), uses the post's background color.
 * Otherwise returns the default background color.
 *
 * @param {string|null} styleVariationId The style variation ID, or null for default.
 * @return {string} The background color.
 */
function usePreviewBackgroundColor( styleVariationId ) {
	const defaultBackgroundColor = useStyle( 'color.background' ) ?? 'white';

	// Get the variation's background color, preferring post data over registered data.
	const variationBackgroundColor = useSelect(
		( select ) => {
			if ( ! styleVariationId ) {
				return null;
			}

			const getRegisteredVariations =
				select( coreStore ).__experimentalGetRegisteredStyleVariations;

			if ( typeof getRegisteredVariations !== 'function' ) {
				return null;
			}

			const variations = getRegisteredVariations() || [];
			const variation = variations.find(
				( v ) => v.id === styleVariationId
			);

			if ( ! variation ) {
				return null;
			}

			// If variation has a post, use the post's background color.
			if ( variation.post_id ) {
				const record = select( coreStore ).getEntityRecord(
					'root',
					'globalStyles',
					variation.post_id
				);
				if ( record?.styles?.color?.background ) {
					return record.styles.color.background;
				}
			}

			// Fall back to registered variation's background color.
			return variation?.styles?.color?.background || null;
		},
		[ styleVariationId ]
	);

	// If variation has a background color, use it. Otherwise use default.
	if ( variationBackgroundColor ) {
		return variationBackgroundColor;
	}

	return defaultBackgroundColor;
}

function useAllDefaultTemplateTypes() {
	const defaultTemplateTypes = useDefaultTemplateTypes();
	const { records: staticRecords } = useEntityRecordsWithPermissions(
		'root',
		'registeredTemplate'
	);
	return [
		...defaultTemplateTypes,
		...staticRecords
			?.filter( ( record ) => ! record.is_custom )
			.map( ( record ) => {
				return {
					slug: record.slug,
					title: record.title.rendered,
					description: record.description,
				};
			} ),
	];
}

function PreviewField( { item } ) {
	// Get the template's style variation ID (if any).
	const styleVariationId = item.style_variation || null;

	// Use variation-aware settings and background color.
	const settings = usePatternSettingsWithVariation( styleVariationId );
	const backgroundColor = usePreviewBackgroundColor( styleVariationId );

	const blocks = useMemo( () => {
		return parse( item.content.raw );
	}, [ item.content.raw ] );

	const isEmpty = ! blocks?.length;
	// Wrap everything in a block editor provider to ensure 'styles' that are needed
	// for the previews are synced between the site editor store and the block editor store.
	// Additionally we need to have the `__experimentalBlockPatterns` setting in order to
	// render patterns inside the previews.
	// TODO: Same approach is used in the patterns list and it becomes obvious that some of
	// the block editor settings are needed in context where we don't have the block editor.
	// Explore how we can solve this in a better way.
	return (
		<EditorProvider post={ item } settings={ settings }>
			<div
				className="page-templates-preview-field"
				style={ { backgroundColor } }
			>
				{ isEmpty && __( 'Empty template' ) }
				{ ! isEmpty && (
					<BlockPreview.Async>
						<BlockPreview blocks={ blocks } />
					</BlockPreview.Async>
				) }
			</div>
		</EditorProvider>
	);
}

export const previewField = {
	label: __( 'Preview' ),
	id: 'preview',
	render: PreviewField,
	enableSorting: false,
};

export const descriptionField = {
	label: __( 'Description' ),
	id: 'description',
	render: window?.__experimentalTemplateActivate
		? function RenderDescription( { item } ) {
				const defaultTemplateTypes = useAllDefaultTemplateTypes();
				const defaultTemplateType = defaultTemplateTypes.find(
					( type ) => type.slug === item.slug
				);
				return item.description
					? decodeEntities( item.description )
					: defaultTemplateType?.description;
		  }
		: ( { item } ) => {
				return item.description && decodeEntities( item.description );
		  },
	enableSorting: false,
	enableGlobalSearch: true,
};

function AuthorField( { item } ) {
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );
	const { text, icon, imageUrl } = useAddedBy( item.type, item.id );

	return (
		<HStack alignment="left" spacing={ 0 }>
			{ imageUrl && (
				<div
					className={ clsx( 'page-templates-author-field__avatar', {
						'is-loaded': isImageLoaded,
					} ) }
				>
					<img
						onLoad={ () => setIsImageLoaded( true ) }
						alt=""
						src={ imageUrl }
					/>
				</div>
			) }
			{ ! imageUrl && (
				<div className="page-templates-author-field__icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span className="page-templates-author-field__name">{ text }</span>
		</HStack>
	);
}

export const authorField = {
	label: __( 'Author' ),
	id: 'author',
	getValue: ( { item } ) => item.author_text ?? item.author,
	render: AuthorField,
};

export const activeField = {
	label: __( 'Status' ),
	id: 'active',
	type: 'boolean',
	getValue: ( { item } ) => item._isActive,
	render: function Render( { item } ) {
		const activeLabel = item._isCustom
			? _x( 'Active when used', 'template' )
			: _x( 'Active', 'template' );
		const activeIntent = item._isCustom ? 'info' : 'success';
		const isActive = item._isActive;
		return (
			<Badge intent={ isActive ? activeIntent : 'default' }>
				{ isActive ? activeLabel : _x( 'Inactive', 'template' ) }
			</Badge>
		);
	},
};

export const useThemeField = () => {
	const activeTheme = useSelect( ( select ) =>
		select( coreStore ).getCurrentTheme()
	);
	return useMemo(
		() => ( {
			label: __( 'Compatible Theme' ),
			id: 'theme',
			getValue: ( { item } ) => item.theme,
			render: function Render( { item } ) {
				if ( item.theme === activeTheme.stylesheet ) {
					return <Badge intent="success">{ item.theme }</Badge>;
				}
				return <Badge intent="error">{ item.theme }</Badge>;
			},
		} ),
		[ activeTheme ]
	);
};

export const slugField = {
	label: __( 'Template Type' ),
	id: 'slug',
	getValue: ( { item } ) => item.slug,
	render: function Render( { item } ) {
		const defaultTemplateTypes = useAllDefaultTemplateTypes();
		const defaultTemplateType = defaultTemplateTypes.find(
			( type ) => type.slug === item.slug
		);
		return defaultTemplateType?.title || _x( 'Custom', 'template type' );
	},
};
