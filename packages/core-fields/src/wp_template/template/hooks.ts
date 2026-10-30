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
 * The post content block of a template is the slot the template rendered
 * inside it takes the place of, so a template without one has nowhere to put
 * it and is left out of the choices. The server works out which post content
 * block is the slot, if any, and reports it: one inside a query loop belongs
 * to the post that loop is rendering.
 *
 * @param template The template to look in.
 */
function hasContentSlot( template: WpTemplate ): boolean {
	return (
		( template as { has_content_slot?: boolean } ).has_content_slot === true
	);
}

/**
 * The templates a template can be rendered inside.
 *
 * Leaves out the template itself and every template already rendered inside
 * it, either of which would make a loop, and every template with no post
 * content block to render it in.
 *
 * @param record The template being edited.
 * @return The templates it can name.
 */
export function useAvailableTemplates(
	record: TemplateWithTemplate
): WpTemplate[] {
	const templates = useTemplates();

	return useMemo( () => {
		const slug = record?.slug;
		if ( ! slug ) {
			return EMPTY_ARRAY;
		}

		const bySlug = new Map(
			templates.map( ( template ) => [ template.slug, template ] )
		);

		// Whether the candidate is already rendered inside the edited
		// template, at any depth, so naming it would make a loop.
		const isRenderedInsideEditedTemplate = ( candidate: WpTemplate ) => {
			const seen = new Set< string >();
			let current: WpTemplate | undefined = candidate;
			while ( current && ! seen.has( current.slug ) ) {
				seen.add( current.slug );
				const renderedInside = ( current as { template?: string } )
					.template;
				if ( ! renderedInside ) {
					return false;
				}
				if ( renderedInside === slug ) {
					return true;
				}
				current = bySlug.get( renderedInside );
			}
			return false;
		};

		return templates.filter(
			( template ) =>
				template.slug !== slug &&
				// The template already named stays a choice whatever it
				// holds, so the control reports what is stored rather than
				// falling back to showing none.
				( template.slug === record?.template ||
					hasContentSlot( template ) ) &&
				! isRenderedInsideEditedTemplate( template )
		);
	}, [ templates, record?.slug, record?.template ] );
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
