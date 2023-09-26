/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import {
	PATTERN_CORE_SOURCES,
	PATTERN_TYPES,
	TEMPLATE_POST_TYPE,
} from '../../../utils/constants';
import { unlock } from '../../../lock-unlock';

export function useEditedPostContext() {
	return useSelect(
		( select ) => select( editSiteStore ).getEditedPostContext(),
		[]
	);
}

export function useIsPostsPage() {
	const { postId } = useEditedPostContext();
	return useSelect(
		( select ) =>
			+postId ===
			select( coreStore ).getEntityRecord( 'root', 'site' )
				?.page_for_posts,
		[ postId ]
	);
}

function useTemplates() {
	return useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords(
				'postType',
				TEMPLATE_POST_TYPE,
				{
					per_page: -1,
					post_type: 'page',
				}
			),
		[]
	);
}

export function useAvailableTemplates() {
	const currentTemplateSlug = useCurrentTemplateSlug();
	const isPostsPage = useIsPostsPage();
	const templates = useTemplates();
	return useMemo(
		() =>
			// The posts page template cannot be changed.
			! isPostsPage &&
			templates?.filter(
				( template ) =>
					template.is_custom &&
					template.slug !== currentTemplateSlug &&
					!! template.content.raw // Skip empty templates.
			),
		[ templates, currentTemplateSlug, isPostsPage ]
	);
}

export function useCurrentTemplateSlug() {
	const { postType, postId } = useEditedPostContext();
	const templates = useTemplates();
	const entityTemplate = useSelect(
		( select ) => {
			const post = select( coreStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
			return post?.template;
		},
		[ postType, postId ]
	);

	if ( ! entityTemplate ) {
		return;
	}
	// If a page has a `template` set and is not included in the list
	// of the theme's templates, do not return it, in order to resolve
	// to the current theme's default template.
	return templates?.find( ( template ) => template.slug === entityTemplate )
		?.slug;
}

// This is duplicated.
const filterOutDuplicatesByName = ( currentItem, index, items ) =>
	index === items.findIndex( ( item ) => currentItem.name === item.name );

function injectThemeAttributeInBlockTemplateContent(
	block,
	currentThemeStylesheet
) {
	block.innerBlocks = block.innerBlocks.map( ( innerBlock ) => {
		if (
			innerBlock.name === 'core/template-part' &&
			innerBlock.attributes.theme === undefined
		) {
			innerBlock.attributes.theme = currentThemeStylesheet;
		}
		return injectThemeAttributeInBlockTemplateContent(
			innerBlock,
			currentThemeStylesheet
		);
	} );

	if (
		block.name === 'core/template-part' &&
		block.attributes.theme === undefined
	) {
		block.attributes.theme = currentThemeStylesheet;
	}
	return block;
}

function preparePatterns( patterns, template, currentThemeStylesheet ) {
	return (
		patterns
			.filter(
				( pattern ) => ! PATTERN_CORE_SOURCES.includes( pattern.source )
			)
			.filter( filterOutDuplicatesByName )
			// Filter only the patterns that are compatible with the current template.
			.filter( ( pattern ) =>
				pattern.templateTypes?.includes( template.slug )
			)
			.map( ( pattern ) => ( {
				...pattern,
				keywords: pattern.keywords || [],
				type: PATTERN_TYPES.theme,
				blocks: parse( pattern.content, {
					__unstableSkipMigrationLogs: true,
				} ).map( ( block ) =>
					injectThemeAttributeInBlockTemplateContent(
						block,
						currentThemeStylesheet
					)
				),
			} ) )
	);
}

// Should we also get templates?
export function useAvailablePatterns( template ) {
	const currentThemeStylesheet = useSelect(
		( select ) => select( coreStore ).getCurrentTheme().stylesheet
	);

	let availablePatterns = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );
		const settings = getSettings();

		const blockPatterns =
			settings.__experimentalAdditionalBlockPatterns ??
			settings.__experimentalBlockPatterns;

		const restBlockPatterns = select( coreStore ).getBlockPatterns();

		const patterns = [
			...( blockPatterns || [] ),
			...( restBlockPatterns || [] ),
		];
		return patterns;
	} );

	availablePatterns = preparePatterns(
		availablePatterns,
		template,
		currentThemeStylesheet
	);

	return availablePatterns;
}
