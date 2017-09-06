/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon, Popover } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import TableOfContentsItem from './item';
import WordCount from '../word-count';
import { getBlocks } from '../selectors';
import { selectBlock } from '../actions';

/**
 * Module constants
 */
const emptyHeadingContent = <em>{ __( '(Empty heading)' ) }</em>;
const incorrectLevelContent = [
	<br key="incorrect-break" />,
	<em key="incorrect-message">{ __( '(Incorrect heading level)' ) }</em>,
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

class TableOfContents extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			showPopover: false,
		};
	}

	render() {
		const { blocks, onSelect } = this.props;
		const headings = filter( blocks, ( block ) => block.name === 'core/heading' );

		if ( headings.length <= 1 ) {
			return null;
		}

		let prevHeadingLevel = 1;

		// Select the corresponding block in the main editor
		// when clicking on a heading item from the list.
		const onSelectHeading = ( uid ) => onSelect( uid );

		const tocItems = headings.map( ( heading, index ) => {
			const headingLevel = getHeadingLevel( heading );
			const isEmpty = isEmptyHeading( heading );

			// Headings remain the same, go up by one, or down by any amount.
			// Otherwise there are missing levels.
			const isIncorrectLevel = headingLevel > prevHeadingLevel + 1;

			const isValid = (
				! isEmpty &&
				! isIncorrectLevel &&
				headingLevel
			);

			prevHeadingLevel = headingLevel;

			return (
				<TableOfContentsItem
					key={ index }
					level={ headingLevel }
					isValid={ isValid }
					onClick={ () => onSelectHeading( heading.uid ) }
				>
					{ isEmpty ? emptyHeadingContent : heading.attributes.content }
					{ isIncorrectLevel && incorrectLevelContent }
				</TableOfContentsItem>
			);
		} );

		return (
			<div className="table-of-contents">
				<button
					className="table-of-contents__toggle"
					onClick={ () => this.setState( { showPopover: ! this.state.showPopover } ) }
				>
					<Dashicon icon="marker" /> { __( 'Info' ) }
				</button>
				<Popover
					isOpen={ this.state.showPopover }
					position="bottom"
					className="table-of-contents__popover"
				>
					<div className="table-of-contents__counts">
						<div className="table-of-contents__count">
							<WordCount />
							{ __( 'Word Count' ) }
						</div>
						<div className="table-of-contents__count">
							<span className="table-of-contents__number">{ blocks.length }</span>
							{ __( 'Blocks' ) }
						</div>
						<div className="table-of-contents__count">
							<span className="table-of-contents__number">{ headings.length }</span>
							{ __( 'Headings' ) }
						</div>
					</div>
					<hr />
					<span className="table-of-contents__title">{ __( 'Table of Contents' ) }</span>
					<div className="table-of-contents__items">
						<ul>{ tocItems }</ul>
					</div>
				</Popover>
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			blocks: getBlocks( state ),
		};
	},
	{
		onSelect( uid ) {
			return selectBlock( uid );
		},
	}
)( TableOfContents );
