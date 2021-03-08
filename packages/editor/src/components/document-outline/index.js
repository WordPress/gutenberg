/**
 * External dependencies
 */
import { countBy, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockContent } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { create, getTextContent } from '@wordpress/rich-text';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import DocumentOutlineItem from './item';

/**
 * Module constants
 */
const emptyHeadingContent = <em>{ __( '(Empty heading)' ) }</em>;
const incorrectLevelContent = [
	<br key="incorrect-break" />,
	<em key="incorrect-message">{ __( '(Incorrect heading level)' ) }</em>,
];
const singleH1Headings = [
	<br key="incorrect-break-h1" />,
	<em key="incorrect-message-h1">
		{ __( '(Your theme may already use a H1 for the post title)' ) }
	</em>,
];
const multipleH1Headings = [
	<br key="incorrect-break-multiple-h1" />,
	<em key="incorrect-message-multiple-h1">
		{ __( '(Multiple H1 headings are not recommended)' ) }
	</em>,
];

/**
 * Extracts heading elements from an HTML string.
 *
 * @param {string} html The HTML string to extract heading elements from.
 *
 * @return {HTMLHeadingElement[]} Array of h1-h6 elements.
 */
function getHeadingElementsFromHTML( html ) {
	// Create a temporary container to put the post content into, so we can
	// use the DOM to find all the headings.
	const tempContainer = document.createElement( 'div' );
	tempContainer.innerHTML = html;

	// Remove template elements so that headings inside them aren't counted.
	// This is only needed for IE11, which doesn't recognize the element and
	// treats it like a div.
	for ( const template of tempContainer.querySelectorAll( 'template' ) ) {
		template.remove();
	}

	return [ ...tempContainer.querySelectorAll( 'h1, h2, h3, h4, h5, h6' ) ];
}

export default function DocumentOutline( {
	onSelect,
	hasOutlineItemsDisabled,
} ) {
	const { headings, isTitleSupported, title } = useSelect( ( select ) => {
		const { getBlocks } = select( blockEditorStore );
		const { getEditedPostAttribute } = select( editorStore );
		const { getPostType } = select( coreStore );

		const postType = getPostType( getEditedPostAttribute( 'type' ) );
		const blocks = getBlocks() ?? [];

		const _headings = [];
		for ( const block of blocks ) {
			if ( block.name === 'core/heading' ) {
				_headings.push( {
					blockClientId: block.clientId,
					content: block.attributes.content,
					isEmpty:
						! block.attributes.content ||
						block.attributes.content.length === 0,
					level: block.attributes.level,
				} );
			} else {
				const headingElements = getHeadingElementsFromHTML(
					getBlockContent( block )
				);
				for ( const element of headingElements ) {
					_headings.push( {
						blockClientId: block.clientId,
						content: element.textContent,
						isEmpty: element.textContent.length === 0,
						// Kinda hacky, but since we know at this point that the tag
						// is an H1-H6, we can just grab the 2nd character of the tag
						// name and convert it to an integer. Should be faster than
						// conditionals.
						level: parseInt( element.tagName[ 1 ], 10 ),
					} );
				}
			}
		}

		return {
			headings: _headings,
			isTitleSupported: get( postType, [ 'supports', 'title' ], false ),
			title: getEditedPostAttribute( 'title' ),
		};
	}, [] );

	if ( headings.length < 1 ) {
		return null;
	}

	let prevHeadingLevel = 1;

	// Not great but it's the simplest way to locate the title right now.
	const titleNode = document.querySelector( '.editor-post-title__input' );
	const hasTitle = isTitleSupported && title && titleNode;
	const countByLevel = countBy( headings, 'level' );
	const hasMultipleH1 = countByLevel[ 1 ] > 1;

	return (
		<div className="document-outline">
			<ul>
				{ hasTitle && (
					<DocumentOutlineItem
						level={ __( 'Title' ) }
						isValid
						onSelect={ onSelect }
						href={ `#${ titleNode.id }` }
						isDisabled={ hasOutlineItemsDisabled }
					>
						{ title }
					</DocumentOutlineItem>
				) }
				{ headings.map( ( item, index ) => {
					// Headings remain the same, go up by one, or down by any amount.
					// Otherwise there are missing levels.
					const isIncorrectLevel = item.level > prevHeadingLevel + 1;

					const isValid =
						! item.isEmpty &&
						! isIncorrectLevel &&
						!! item.level &&
						( item.level !== 1 ||
							( ! hasMultipleH1 && ! hasTitle ) );
					prevHeadingLevel = item.level;

					return (
						<DocumentOutlineItem
							key={ index }
							level={ `H${ item.level }` }
							isValid={ isValid }
							isDisabled={ hasOutlineItemsDisabled }
							href={ `#block-${ item.blockClientId }` }
							onSelect={ onSelect }
						>
							{ item.isEmpty
								? emptyHeadingContent
								: getTextContent(
										create( {
											html: item.content,
										} )
								  ) }
							{ isIncorrectLevel && incorrectLevelContent }
							{ item.level === 1 &&
								hasMultipleH1 &&
								multipleH1Headings }
							{ hasTitle &&
								item.level === 1 &&
								! hasMultipleH1 &&
								singleH1Headings }
						</DocumentOutlineItem>
					);
				} ) }
			</ul>
		</div>
	);
}
