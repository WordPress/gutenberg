import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { getItemTitle } from '../../shared/title/get-item-title';
import { useRenderedInsideTemplate } from './hooks';
import type { TemplateWithTemplate } from './types';

/*
 * The template a template is rendered inside.
 */

type TemplateViewProps = Pick<
	DataViewRenderFieldProps< TemplateWithTemplate >,
	'item'
>;

export default function TemplateView( { item }: TemplateViewProps ) {
	const renderedInside = useRenderedInsideTemplate( item );

	return (
		<>{ renderedInside ? getItemTitle( renderedInside ) : __( 'None' ) }</>
	);
}
