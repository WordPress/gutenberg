import { layout } from '@wordpress/icons';
import { getTemplatePartIcon } from './get-template-part-icon';
import type { TemplateInfo, TemplateInfoParams, TemplateType } from './types';

const EMPTY_OBJECT = {};

/**
 * Helper function to retrieve the corresponding template info for a given template.
 * @param params
 * @param params.templateTypes
 * @param params.templateAreas
 * @param params.template
 */
export const getTemplateInfo = (
	params: TemplateInfoParams | undefined
): TemplateInfo => {
	if ( ! params ) {
		// Every field of the info is optional.
		return EMPTY_OBJECT as TemplateInfo;
	}

	const { templateTypes, templateAreas, template } = params;

	const { description, slug, title, area } = template;

	const { title: defaultTitle, description: defaultDescription } =
		Object.values( templateTypes ).find( ( type ) => type.slug === slug ) ??
		// An unknown slug has no default title or description.
		( EMPTY_OBJECT as Partial< TemplateType > );

	const templateTitle = typeof title === 'string' ? title : title?.rendered;
	const templateDescription =
		typeof description === 'string' ? description : description?.raw;

	const templateAreasWithIcon = templateAreas?.map( ( item ) => ( {
		...item,
		icon: getTemplatePartIcon( item.icon ),
	} ) );

	const templateIcon =
		templateAreasWithIcon?.find( ( item ) => area === item.area )?.icon ||
		layout;

	return {
		title:
			templateTitle && templateTitle !== slug
				? templateTitle
				: defaultTitle || slug,
		description: templateDescription || defaultDescription,
		icon: templateIcon,
	};
};
