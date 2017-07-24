/**
 * External Dependencies
 */
import { connect } from 'react-redux';
import { filter } from 'lodash';

/**
 * WordPress Dependencies
 */
import { __, sprintf } from 'i18n';
import { PanelBody } from 'components';

/**
 * Internal Dependencies
 */
import './style.scss';
import TableOfContentsItem from './item';
import { getBlocks } from '../../selectors';

/**
 * Module Constants
 */
const missingHeadingContent = <em>{ __( '(Missing heading level)' ) }</em>;
const emptyHeadingContent = <em>{ __( '(Empty heading)' ) }</em>;

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

const TableOfContents = ( { blocks } ) => {
	const headings = filter( blocks, ( block ) => block.name === 'core/heading' );

	const tocItems = [];
	let prevHeadingLevel = 1;

	headings.forEach( ( heading, index ) => {
		const headingLevel = getHeadingLevel( heading );
		const isEmpty = isEmptyHeading( heading );
		let isValid = ! isEmpty && headingLevel;
		// Headings can go up by one or down by any amount. Otherwise there are missing levels.
		if ( headingLevel > prevHeadingLevel + 1 ) {
			isValid = false;
			for ( let missingLevel = prevHeadingLevel + 1; headingLevel > missingLevel; missingLevel++ ) {
				tocItems.push(
					<TableOfContentsItem key={ `${ index }.${ missingLevel }` } level={ missingLevel }>
						{ missingHeadingContent }
					</TableOfContentsItem>
				);
			}
		}

		tocItems.push(
			<TableOfContentsItem
				key={ index++ }
				level={ headingLevel }
				isValid={ isValid }
			>
				{ isEmpty ? emptyHeadingContent : heading.attributes.content }
			</TableOfContentsItem>
		);

		prevHeadingLevel = headingLevel;
	} );

	return (
		<PanelBody title={ __( 'Table of Contents (experimental)' ) } initialOpen={ false }>
			<div className="table-of-contents__items">
				{ headings.length > 1 && <p><strong>{ sprintf( '%d Headings', headings.length ) }</strong></p> }
				{ tocItems }
			</div>
		</PanelBody>
	);
};

export default connect(
	( state ) => {
		return {
			blocks: getBlocks( state ),
		};
	}
)( TableOfContents );
