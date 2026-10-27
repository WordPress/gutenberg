import { useEntityBlockEditor, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { useMemo } from '@wordpress/element';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';

const EMPTY_ARRAY = [];

/**
 * Flattens a block tree in document order, the same order the server walks
 * the post content in.
 *
 * @param {Object[]} blocks Blocks to flatten.
 *
 * @return {Object[]} Flat list of blocks.
 */
function flattenBlocks( blocks ) {
	return blocks.flatMap( ( block ) => [
		block,
		...flattenBlocks( block.innerBlocks ?? [] ),
	] );
}

function getLatestHeadings(
	blocks,
	clientId,
	permalink,
	{ onlyIncludeCurrentPage, maxLevel }
) {
	const allBlocks = flattenBlocks( blocks );
	const isPaginated = allBlocks.some(
		( block ) => block.name === 'core/nextpage'
	);

	// If onlyIncludeCurrentPage is true, calculate the page (of a paginated post) this block is part of, so we know which headings to include; otherwise, skip the calculation.
	// A Table of Contents placed outside the post content, in a template,
	// is not part of the post, so it uses the first page.
	let tocPage = 1;

	if ( isPaginated && onlyIncludeCurrentPage ) {
		const tocIndex = allBlocks.findIndex(
			( block ) => block.clientId === clientId
		);

		for ( const block of allBlocks.slice( 0, Math.max( tocIndex, 0 ) ) ) {
			if ( block.name === 'core/nextpage' ) {
				tocPage++;
			}
		}
	}

	const latestHeadings = [];

	/** The page (of a paginated post) a heading will be part of. */
	let headingPage = 1;
	let headingPageLink = null;

	if ( typeof permalink === 'string' ) {
		headingPageLink = isPaginated
			? addQueryArgs( permalink, { page: headingPage } )
			: permalink;
	}

	for ( const block of allBlocks ) {
		if ( block.name === 'core/nextpage' ) {
			headingPage++;

			// If we're only including headings from the current page (of
			// a paginated post), then exit the loop if we've reached the
			// pages after the one with the Table of Contents block.
			if ( onlyIncludeCurrentPage && headingPage > tocPage ) {
				break;
			}

			if ( typeof permalink === 'string' ) {
				headingPageLink = addQueryArgs(
					removeQueryArgs( permalink, [ 'page' ] ),
					{ page: headingPage }
				);
			}
		}
		// If we're including all headings or we've reached headings on
		// the same page as the Table of Contents block, add them to the
		// list.
		else if ( ! onlyIncludeCurrentPage || headingPage === tocPage ) {
			if ( block.name === 'core/heading' ) {
				const headingAttributes = block.attributes;

				// Skip headings that are deeper than maxLevel
				if ( maxLevel && headingAttributes.level > maxLevel ) {
					continue;
				}

				const canBeLinked =
					typeof headingPageLink === 'string' &&
					typeof headingAttributes.anchor === 'string' &&
					headingAttributes.anchor !== '';

				latestHeadings.push( {
					// Convert line breaks to spaces, and get rid of HTML tags in the headings.
					content: stripHTML(
						headingAttributes.content.replace(
							/(<br *\/?>)+/g,
							' '
						)
					),
					level: headingAttributes.level,
					link: canBeLinked
						? `${ headingPageLink }#${ headingAttributes.anchor }`
						: null,
				} );
			}
		}
	}

	return latestHeadings;
}

/**
 * Returns the headings of the post given by the block context, including
 * unsaved edits.
 *
 * @param {Object}  options
 * @param {string}  options.clientId               Table of Contents block client ID.
 * @param {number}  options.postId                 Post ID from the block context.
 * @param {string}  options.postType               Post type from the block context.
 * @param {boolean} options.onlyIncludeCurrentPage Whether to only include headings from the current page.
 * @param {number}  options.maxLevel               Maximum heading level to include.
 *
 * @return {Object[]} Heading data.
 */
export function useHeadings( {
	clientId,
	postId,
	postType,
	onlyIncludeCurrentPage,
	maxLevel,
} ) {
	const [ blocks ] = useEntityBlockEditor( 'postType', postType, {
		id: postId,
	} );
	const permalink = useSelect(
		( select ) =>
			postId
				? select( coreStore ).getEditedEntityRecord(
						'postType',
						postType,
						postId
					)?.link
				: undefined,
		[ postType, postId ]
	);

	return useMemo( () => {
		if ( ! postId || ! blocks ) {
			return EMPTY_ARRAY;
		}

		return getLatestHeadings( blocks, clientId, permalink, {
			onlyIncludeCurrentPage,
			maxLevel,
		} );
	}, [
		blocks,
		clientId,
		permalink,
		postId,
		onlyIncludeCurrentPage,
		maxLevel,
	] );
}
