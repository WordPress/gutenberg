import { store as coreStore } from '@wordpress/core-data';
import type { WpTemplate } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import type { TemplateWithTemplate } from './types';

/*
 * The hooks of the template field of a template.
 */

const EMPTY_ARRAY: WpTemplate[] = [];

/**
 * Every template of the site, which any user who can edit templates may read.
 */
function useTemplates(): WpTemplate[] {
	return useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords< WpTemplate >(
				'postType',
				'wp_template',
				{ per_page: -1 }
			) ?? EMPTY_ARRAY,
		[]
	);
}

/**
 * Whether a template has somewhere to render another template.
 *
 * The template slot block of a template is where a template rendered inside
 * it goes, so a template without one has nowhere to put it and is left out of
 * the choices. The server reports it, having looked in the template's
 * patterns too.
 *
 * @param template The template to look in.
 */
function hasTemplateSlot( template: WpTemplate ): boolean {
	return (
		( template as { has_template_slot?: boolean } ).has_template_slot ===
		true
	);
}

/**
 * Whether a template names a template to be rendered inside.
 *
 * @param template The template to look at.
 */
function namesTemplate( template: WpTemplate ): boolean {
	return !! ( template as { template?: string } ).template;
}

/**
 * The templates a template can be rendered inside.
 *
 * Templates nest one level deep, which is all the editor and the front end
 * render: a template can name one that is rendered on its own, and only when
 * no other template is rendered inside it. That leaves out the template
 * itself, every template that names one of its own, every template when the
 * edited one has templates rendered inside it, and every template with no template
 * slot block to render it in.
 *
 * @param templates Every template of the site.
 * @param record    The template being edited.
 * @return The templates it can name.
 */
export function getAvailableTemplates(
	templates: WpTemplate[],
	record: Pick< TemplateWithTemplate, 'slug' | 'template' >
): WpTemplate[] {
	const slug = record.slug;
	if ( ! slug ) {
		return EMPTY_ARRAY;
	}

	// A template other templates are rendered inside would put them two
	// levels deep if it named one of its own.
	const hasTemplatesInside = templates.some(
		( template ) => ( template as { template?: string } ).template === slug
	);

	return templates.filter( ( template ) => {
		if ( template.slug === slug ) {
			return false;
		}

		// The template already named stays a choice whatever it holds, so
		// the control reports what is stored rather than falling back to
		// showing none.
		if ( template.slug === record.template ) {
			return true;
		}

		return (
			! hasTemplatesInside &&
			! namesTemplate( template ) &&
			hasTemplateSlot( template )
		);
	} );
}

/**
 * The templates a template can be rendered inside, see getAvailableTemplates().
 *
 * @param record The template being edited.
 * @return The templates it can name.
 */
export function useAvailableTemplates(
	record: TemplateWithTemplate
): WpTemplate[] {
	const templates = useTemplates();
	const slug = record?.slug;
	const renderedInside = record?.template;

	return useMemo(
		() =>
			getAvailableTemplates( templates, {
				slug,
				template: renderedInside,
			} ),
		[ templates, slug, renderedInside ]
	);
}

/**
 * The template a template is rendered inside.
 *
 * @param record The template being edited.
 * @return The template it names, or `undefined` when it is rendered on its own.
 */
export function useRenderedInsideTemplate(
	record: TemplateWithTemplate
): WpTemplate | undefined {
	const templates = useTemplates();
	const renderedInside = record?.template;

	return useMemo(
		() =>
			renderedInside
				? templates.find(
						( template ) => template.slug === renderedInside
					)
				: undefined,
		[ templates, renderedInside ]
	);
}
