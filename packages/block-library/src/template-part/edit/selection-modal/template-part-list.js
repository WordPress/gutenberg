/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import { useAsyncList } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { createTemplatePartId } from '../utils/create-template-part-id';

export default function TemplatePartList( { area, templatePartId, onSelect } ) {
	const templateParts = useSelect( ( select ) => {
		return select( coreStore ).getEntityRecords(
			'postType',
			'wp_template_part',
			{
				per_page: -1,
			}
		);
	}, [] );

	const templatePartsToShow = useMemo( () => {
		if ( ! templateParts ) {
			return [];
		}
		return (
			templateParts.filter(
				( templatePart ) =>
					createTemplatePartId(
						templatePart.theme,
						templatePart.slug
					) !== templatePartId &&
					( ! area ||
						'uncategorized' === area ||
						templatePart.area === area )
			) || []
		);
	}, [ templateParts, area ] );

	// We can map template parts to block patters to reuse the BlockPatternsList UI
	const blockPatterns = useMemo( () => {
		return templatePartsToShow.map( ( templatePart ) => ( {
			name: createTemplatePartId( templatePart.theme, templatePart.slug ),
			title: templatePart.title.rendered,
			blocks: parse( templatePart.content.raw ),
			templatePart,
		} ) );
	}, [ templatePartsToShow ] );

	const shownPatterns = useAsyncList( blockPatterns );

	if ( ! templateParts || ! templateParts.length ) {
		return __( 'There are no existing template parts to select.' );
	}

	return (
		<BlockPatternsList
			blockPatterns={ blockPatterns }
			shownPatterns={ shownPatterns }
			onClickPattern={ ( pattern ) => {
				onSelect( pattern.templatePart );
			} }
		/>
	);
}
