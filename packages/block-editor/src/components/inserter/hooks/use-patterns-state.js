/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import {
	store as blocksStore,
	cloneBlock,
	__experimentalGetBlockLabel as getBlockLabel,
	getBlockType,
} from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/**
 * Retrieves the block patterns inserter state.
 *
 * @param {Function} onInsert     function called when inserter a list of blocks.
 * @param {string=}  rootClientId Insertion's root client ID.
 *
 * @return {Array} Returns the patterns state. (patterns, categories, onSelect handler)
 */
const usePatternsState = ( onInsert, rootClientId ) => {
	const { patternCategories, patterns } = useSelect(
		( select ) => {
			const { __experimentalGetAllowedPatterns, getSettings } = select(
				blockEditorStore
			);

			const activeTemplatePartId = select(
				blockEditorStore
			).__experimentalGetActiveBlockIdByBlockNames( [
				'core/template-part',
			] );

			const contextualPatterns = {
				patterns: [],
				patternCategories: [],
			};

			if ( activeTemplatePartId ) {
				const block = select( blockEditorStore ).getBlock(
					activeTemplatePartId
				);
				const variations = select( blocksStore ).getBlockVariations(
					'core/template-part'
				);

				const activeVariation = variations.find( ( variation ) =>
					variation.isActive?.(
						block.attributes,
						variation.attributes
					)
				);

				const templatePartpatterns = select(
					blockEditorStore
				).__experimentalGetScopedBlockPatterns(
					'block',
					'core/template-part'
				);

				const contextualInserterPatterns = templatePartpatterns.filter(
					( pattern ) =>
						pattern.scope.variation === activeVariation?.name
				);

				contextualPatterns.patterns = contextualInserterPatterns;
				contextualPatterns.patternCategories = [
					{
						name: `${ block.name }_` + activeVariation.name,
						label: getBlockLabel(
							getBlockType( block.name ),
							block.attributes
						),
					},
				];
			}

			const inserterPatterns = __experimentalGetAllowedPatterns(
				rootClientId
			).filter(
				( pattern ) => ! pattern.scope || pattern.scope.inserter
			);

			return {
				patterns: [
					...contextualPatterns.patterns,
					...inserterPatterns,
				],
				patternCategories: [
					...contextualPatterns.patternCategories,
					...getSettings().__experimentalBlockPatternCategories,
				],
			};
		},
		[ rootClientId ]
	);
	const { createSuccessNotice } = useDispatch( noticesStore );
	const onClickPattern = useCallback( ( pattern, blocks ) => {
		onInsert(
			map( blocks, ( block ) => cloneBlock( block ) ),
			pattern.name
		);
		createSuccessNotice(
			sprintf(
				/* translators: %s: block pattern title. */
				__( 'Block pattern "%s" inserted.' ),
				pattern.title
			),
			{
				type: 'snackbar',
			}
		);
	}, [] );

	return [ patterns, patternCategories, onClickPattern ];
};

export default usePatternsState;
