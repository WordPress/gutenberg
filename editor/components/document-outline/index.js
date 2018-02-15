/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { filter, countBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import DocumentOutlineItem from './item';
import { getBlocks, getEditedPostAttribute } from '../../store/selectors';
import { selectBlock } from '../../store/actions';

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
	<em key="incorrect-message-h1">{ __( '(Your theme may already use a H1 for the post title)' ) }</em>,
];
const multipleH1Headings = [
	<br key="incorrect-break-multiple-h1" />,
	<em key="incorrect-message-multiple-h1">{ __( '(Multiple H1 headings are not recommended)' ) }</em>,
];

const getHeadingLevel = heading => {
	switch ( heading.attributes.nodeName ) {
		case 'h1':
		case 'H1':
			return 1;
		case 'h2':
		case 'H2':
			return 2;
		case 'h3':
		case 'H3':
			return 3;
		case 'h4':
		case 'H4':
			return 4;
		case 'h5':
		case 'H5':
			return 5;
		case 'h6':
		case 'H6':
			return 6;
	}
};

const isEmptyHeading = heading => ! heading.attributes.content || heading.attributes.content.length === 0;

export const DocumentOutline = ( { blocks = [], title, onSelect } ) => {
	const headings = filter( blocks, ( block ) => block.name === 'core/heading' );

	if ( headings.length < 1 ) {
		return null;
	}

	let prevHeadingLevel = 1;

	// Select the corresponding block in the main editor
	// when clicking on a heading item from the list.
	const onSelectHeading = ( uid ) => onSelect( uid );
	const focusTitle = () => {
		// Not great but it's the simplest way to focus the title right now.
		const titleNode = document.querySelector( '.editor-post-title__input' );
		if ( titleNode ) {
			titleNode.focus();
		}
	};

	const items = headings.map( ( heading ) => ( {
		...heading,
		level: getHeadingLevel( heading ),
		isEmpty: isEmptyHeading( heading ),
	} ) );
	const countByLevel = countBy( items, 'level' );
	const hasMultipleH1 = countByLevel[ 1 ] > 1;

	return (
		<div className="document-outline">
			<ul>
				{ title && (
					<DocumentOutlineItem
						level="Title"
						isValid
						onClick={ focusTitle }
					>
						{ title }
					</DocumentOutlineItem>
				) }
				{ items.map( ( item, index ) => {
					// Headings remain the same, go up by one, or down by any amount.
					// Otherwise there are missing levels.
					const isIncorrectLevel = item.level > prevHeadingLevel + 1;

					const isValid = (
						! item.isEmpty &&
						! isIncorrectLevel &&
						!! item.level &&
						( item.level !== 1 || ( ! hasMultipleH1 && ! title ) )
					);
					prevHeadingLevel = item.level;

					return (
						<DocumentOutlineItem
							key={ index }
							level={ `H${ item.level }` }
							isValid={ isValid }
							onClick={ () => onSelectHeading( item.uid ) }
						>
							{ item.isEmpty ? emptyHeadingContent : item.attributes.content }
							{ isIncorrectLevel && incorrectLevelContent }
							{ item.level === 1 && hasMultipleH1 && multipleH1Headings }
							{ title && item.level === 1 && ! hasMultipleH1 && singleH1Headings }
						</DocumentOutlineItem>
					);
				} ) }
			</ul>
		</div>
	);
};

export default connect(
	( state ) => {
		return {
			title: getEditedPostAttribute( state, 'title' ),
			blocks: getBlocks( state ),
		};
	},
	{
		onSelect( uid ) {
			return selectBlock( uid );
		},
	}
)( DocumentOutline );
