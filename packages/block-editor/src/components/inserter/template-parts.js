/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { parse, cloneBlock } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';
import { ENTER, SPACE } from '@wordpress/keycodes';
/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';

function TemplatePartItem( { templatePart, onInsert } ) {
	const { id, slug, theme } = templatePart;
	const blocks = useMemo( () => parse( templatePart.content.raw ), [
		templatePart.content.raw,
	] );

	const blocksToInsert = useMemo(
		() =>
			parse(
				`<!-- wp:template-part {"postId":${ id },"slug":"${ slug }","theme":"${ theme }"} /-->`
			),
		[ id, slug, theme ]
	);

	const onClick = () =>
		onInsert( map( blocksToInsert, ( block ) => cloneBlock( block ) ) );

	return (
		<div
			role="button"
			onClick={ onClick }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					onClick();
				}
			} }
			tabIndex={ 0 }
		>
			<BlockPreview blocks={ blocks } />
			<div>{ templatePart.slug }</div>
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
		<div>
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
		</div>
	);
}
