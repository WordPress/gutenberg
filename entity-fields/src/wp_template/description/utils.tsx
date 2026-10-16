import { decodeEntities } from '@wordpress/html-entities';
import { Text } from '@wordpress/ui';

/**
 * The properties of a template the description fields read.
 */
export interface TemplateWithDescription {
	description?: string;
	source?: string;
	has_theme_file?: boolean;
	is_custom?: boolean;
}

/**
 * Whether the template is a custom template a user created, the only ones
 * whose description can be edited. Theme-provided templates surface a
 * read-only description instead.
 *
 * @param item The template.
 * @return Whether it is a custom template.
 */
export const isCustomTemplate = ( item: TemplateWithDescription ) =>
	item.source === 'custom' && ! item.has_theme_file && !! item.is_custom;

/**
 * The decoded description of a template.
 *
 * @param args      The arguments.
 * @param args.item The template.
 * @return The description.
 */
export const getValue = ( { item }: { item: TemplateWithDescription } ) =>
	decodeEntities( item.description || '' );

/**
 * Renders the description of a template.
 *
 * @param props      The props.
 * @param props.item The template.
 * @return The description, if any.
 */
export const render = ( { item }: { item: TemplateWithDescription } ) => {
	const { description } = item;
	return description ? <Text>{ decodeEntities( description ) }</Text> : null;
};
