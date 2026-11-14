import type { Field } from '@wordpress/dataviews';
import TemplateEdit from './edit';
import TemplateView from './view';
import type { TemplateWithTemplate } from './types';

/**
 * The JavaScript parts of the field naming the template a template is
 * rendered inside; its data is registered in PHP.
 *
 * The field's id is `parent_template`, apart from the `template` of every
 * other post type, which is the template that renders a post. Its value is
 * the `template` REST field, which matches the one on a post.
 */
export const fieldExtensions: Partial<
	Omit< Field< TemplateWithTemplate >, 'id' >
> = {
	getValue: ( { item } ) => item.template ?? '',
	setValue: ( { value } ) => ( { template: value } ),
	Edit: TemplateEdit,
	render: TemplateView,
};
