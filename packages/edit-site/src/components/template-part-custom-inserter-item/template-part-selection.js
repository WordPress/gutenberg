/**
 * WordPress dependencies
 */
import { __experimentalBlockPatternsList as BlockPatternsList } from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import { useAsyncList } from '@wordpress/compose';
import {
	__experimentalHStack as HStack,
	SearchControl,
} from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	createTemplatePartId,
	searchPatterns,
	useAlternativeBlockPatterns,
	useAlternativeTemplateParts,
} from './utils';

/**
 * Convert template part (wp_template_part posts) to a pattern format accepted
 * by the `BlockPatternsList` component.
 *
 * @param {Array} templateParts An array of wp_template_part posts.
 *
 * @return {Array} Template parts as patterns.
 */
const convertTemplatePartsToPatterns = ( templateParts ) =>
	templateParts?.map( ( templatePart ) => ( {
		name: createTemplatePartId( templatePart.theme, templatePart.slug ),
		title: templatePart.title.rendered,
		blocks: parse( templatePart.content.raw ),
		templatePart,
	} ) );

export default function TemplatePartSelection( {
	area,
	rootClientId,
	templatePartId,
	onTemplatePartSelect,
	onPatternSelect,
} ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const { templateParts } = useAlternativeTemplateParts(
		area,
		templatePartId
	);
	const filteredTemplatePartPatterns = useMemo( () => {
		const partsAsPatterns = convertTemplatePartsToPatterns( templateParts );
		return searchPatterns( partsAsPatterns, searchValue );
	}, [ templateParts, searchValue ] );
	const shownTemplatePartPatterns = useAsyncList(
		filteredTemplatePartPatterns
	);

	const patterns = useAlternativeBlockPatterns( area, rootClientId );
	const filteredPatterns = useMemo(
		() => searchPatterns( patterns, searchValue ),
		[ patterns, searchValue ]
	);
	const shownPatterns = useAsyncList( filteredPatterns );

	const hasTemplateParts = !! filteredTemplatePartPatterns.length;
	const hasBlockPatterns = !! filteredPatterns.length;

	return (
		<>
			<div className="block-library-template-part-selection__search">
				<SearchControl
					onChange={ setSearchValue }
					value={ searchValue }
					label={ __( 'Search for replacements' ) }
					placeholder={ __( 'Search' ) }
				/>
			</div>
			{ !! templateParts?.length && (
				<div>
					<h2>{ __( 'Existing template parts' ) }</h2>
					<BlockPatternsList
						blockPatterns={ filteredTemplatePartPatterns }
						shownPatterns={ shownTemplatePartPatterns }
						onClickPattern={ onTemplatePartSelect }
					/>
				</div>
			) }
			{ !! patterns?.length && (
				<>
					<h2>{ __( 'Patterns' ) }</h2>
					<BlockPatternsList
						blockPatterns={ filteredPatterns }
						shownPatterns={ shownPatterns }
						onClickPattern={ onPatternSelect }
					/>
				</>
			) }
			{ ! hasTemplateParts && ! hasBlockPatterns && (
				<HStack alignment="center">
					<p>{ __( 'No results found.' ) }</p>
				</HStack>
			) }
		</>
	);
}
