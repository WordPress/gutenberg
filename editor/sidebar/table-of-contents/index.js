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

const headingToInt = ( heading ) => {
	switch ( heading.toUpperCase() ) {
		case 'H1': return 1;
		case 'H2': return 2;
		case 'H3': return 3;
		case 'H4': return 4;
		case 'H5': return 5;
		case 'H6': return 6;
	}
};

const headingsInit = () => [ [], 1, 0 ];

const headingsReducer = ( [ hs, previousLevel, index ], heading ) => {
	const nodeName = heading.attributes.nodeName;
	const headingLevel = headingToInt( nodeName );

	let valid = heading.attributes.content && heading.attributes.content.length > 0;

	// Headings can go up by one or down by any amount. Otherwise there are missing levels.
	if ( headingLevel > previousLevel + 1 ) {
		valid = false;
		let i = previousLevel + 1;
		while ( i < headingLevel ) {
			hs.push(
				<TableOfContentsItem
					key={ index++ }
					level={ i }
				>
					<em>{ __( '(Missing header level)' ) }</em>
				</TableOfContentsItem>
			);
			i++;
		}
	}

	return [
		hs.concat(
			<TableOfContentsItem
				key={ index++ }
				level={ headingLevel }
				valid={ valid }
			>
				{ heading.attributes.content.length
					? heading.attributes.content
					: <em>{ __( '(Empty header)' ) }</em>
				}
			</TableOfContentsItem>
		),
		headingLevel,
		index,
	];
};

const TableOfContents = ( { blocks } ) => {
	const headings = filter( blocks, ( block ) => block.name === 'core/heading' );
	return (
		<PanelBody title={ __( 'Table of Contents (experimental)' ) } initialOpen={ false }>
			<div className="table-of-contents__items">
				{ headings.length > 1 && <p><strong>{ sprintf( '%d Headings', headings.length ) }</strong></p> }
				{ headings.reduce( headingsReducer, headingsInit() )[ 0 ] }
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
