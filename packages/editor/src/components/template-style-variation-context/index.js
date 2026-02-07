/**
 * WordPress dependencies
 */
import { createContext, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Context for template-specific style variations.
 *
 * This context provides information about whether the current template
 * has an associated style variation, and if so, which one.
 */
export const TemplateStyleVariationContext = createContext( {
	templateId: null,
	styleVariationId: null,
	styleVariationPostId: null,
	baseThemeId: null,
	isTemplateStyleVariationsEnabled: false,
} );

/**
 * Provider component for template style variation context.
 *
 * This component fetches the current template's style variation (if any)
 * and provides it to child components via context.
 *
 * It handles two cases:
 * 1. Directly editing a template (postType === 'wp_template')
 * 2. Editing a page/post with its template (postType !== 'wp_template' but templateId is set)
 *
 * @param {Object}  props                    Component props.
 * @param {Element} props.children           Child components.
 * @param {string}  props.resolvedTemplateId Optional template ID passed directly from parent.
 *                                           Takes precedence over editor store value to avoid
 *                                           timing issues during navigation.
 * @return {Element} Provider component.
 */
export function TemplateStyleVariationProvider( {
	children,
	resolvedTemplateId,
} ) {
	// First, get the current post info to determine which template to use.
	// This needs to be reactive to navigation changes.
	const { postType, postId, currentTemplateId } = useSelect( ( select ) => {
		const {
			getCurrentPostType,
			getCurrentPostId,
			getCurrentTemplateId: getTemplateId,
		} = select( editorStore );

		return {
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
			currentTemplateId: getTemplateId(),
		};
	}, [] );

	// Determine the effective template ID based on what we're editing.
	// If resolvedTemplateId is provided (from parent during navigation),
	// use it to avoid timing issues with the editor store update.
	const effectiveTemplateId =
		resolvedTemplateId ||
		( postType === 'wp_template' ? postId : currentTemplateId );

	// Now fetch the template data with the effective template ID as a dependency.
	// This ensures we re-fetch when the template changes during navigation.
	const {
		templateId,
		styleVariationId,
		styleVariationPostId,
		baseThemeId,
		isEnabled,
	} = useSelect(
		( select ) => {
			if ( ! effectiveTemplateId ) {
				return {
					templateId: null,
					styleVariationId: null,
					styleVariationPostId: null,
					baseThemeId: null,
					isEnabled: false,
				};
			}

			const { getEditedEntityRecord, getEntityRecord } =
				select( coreStore );

			// Trigger the fetch for the template.
			getEntityRecord( 'postType', 'wp_template', effectiveTemplateId );

			// Get the template record (with any local edits).
			const template = getEditedEntityRecord(
				'postType',
				'wp_template',
				effectiveTemplateId
			);

			if ( ! template ) {
				return {
					templateId: effectiveTemplateId,
					styleVariationId: null,
					styleVariationPostId: null,
					baseThemeId: null,
					isEnabled: true,
				};
			}

			// The style_variation field contains the registered variation string ID.
			const variationId = template.style_variation || null;

			// Look up the variation's post_id and base_theme from the registry.
			let variationPostId = null;
			let variationBaseThemeId = null;

			if ( variationId ) {
				const getRegisteredVariations =
					select(
						coreStore
					).__experimentalGetRegisteredStyleVariations;
				if ( typeof getRegisteredVariations === 'function' ) {
					const variations = getRegisteredVariations() || [];
					const variation = variations.find(
						( v ) => v.id === variationId
					);
					if ( variation ) {
						variationPostId = variation.post_id || null;
						variationBaseThemeId = variation.base_theme || null;
					}
				}
			}

			return {
				templateId: template.id || effectiveTemplateId,
				styleVariationId: variationId,
				styleVariationPostId: variationPostId,
				baseThemeId: variationBaseThemeId,
				isEnabled: true,
			};
		},
		[ effectiveTemplateId ]
	);

	const contextValue = useMemo(
		() => ( {
			templateId,
			styleVariationId,
			styleVariationPostId,
			baseThemeId,
			isTemplateStyleVariationsEnabled: isEnabled,
		} ),
		[
			templateId,
			styleVariationId,
			styleVariationPostId,
			baseThemeId,
			isEnabled,
		]
	);

	return (
		<TemplateStyleVariationContext.Provider value={ contextValue }>
			{ children }
		</TemplateStyleVariationContext.Provider>
	);
}

export default TemplateStyleVariationContext;
