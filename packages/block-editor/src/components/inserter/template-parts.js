/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { parse } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';

function TemplatePartItem( { templatePart } ) {
	const blocks = useMemo( () => parse( templatePart.content.raw ), [
		templatePart.content.raw,
	] );

	return (
		<div>
			<BlockPreview blocks={ blocks } />
			<div>{ templatePart.slug }</div>
		</div>
	);
}

export default function TemplateParts() {
	const templateParts = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords(
			'postType',
			'wp_template_part',
			{
				status: [ 'publish', 'auto-draft' ],
			}
		);
	}, [] );

	if ( ! Array.isArray( templateParts ) ) {
		return null;
	}

	return (
		<div>
			{ templateParts.map( ( templatePart ) => {
				return (
					<TemplatePartItem
						key={ templatePart.id }
						templatePart={ templatePart }
					/>
				);
			} ) }
		</div>
	);
}
