/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { parse, createBlock } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';
import { ENTER, SPACE } from '@wordpress/keycodes';
/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import InserterPanel from './panel';

function TemplatePartItem( { templatePart, onInsert } ) {
	const { id, slug, theme } = templatePart;
	const content = templatePart.content.raw || '';
	const blocks = useMemo( () => parse( content ), [ content ] );
	const templatePartBlock = createBlock( 'core/template-part', {
		postId: id,
		slug,
		theme,
	} );

	const onClick = () => onInsert( templatePartBlock );

	return (
		<div
			className="block-editor-inserter__template-part-item"
			role="button"
			onClick={ onClick }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					onClick();
				}
			} }
			tabIndex={ 0 }
			aria-label={ templatePart.slug }
		>
			<BlockPreview blocks={ blocks } />
			<div className="block-editor-inserter__template-part-item-title">
				{ templatePart.slug }
			</div>
		</div>
	);
}

export default function TemplateParts( { onInsert } ) {
	const templateParts = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords(
			'postType',
			'wp_template_part',
			{
				status: [ 'publish', 'auto-draft' ],
			}
		);
	}, [] );

	return (
		<InserterPanel>
			{ templateParts &&
				templateParts.map( ( templatePart ) => {
					return (
						<TemplatePartItem
							key={ templatePart.id }
							templatePart={ templatePart }
							onInsert={ onInsert }
						/>
					);
				} ) }
		</InserterPanel>
	);
}
