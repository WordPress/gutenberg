/**
 * External dependencies
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
import { getBlocks } from '../../selectors';

const TableOfContents = ( { blocks } ) => {
	const headings = filter( blocks, ( block ) => block.name === 'core/heading' );

	return (
		<PanelBody title={ __( 'Table of Content (experimental)' ) } initialOpen={ false }>
			<div className="table-of-content__items">
				{ headings.length > 1 && <p><strong>{ sprintf( '%d Headings', headings.length ) }</strong></p> }
				{ headings.map( ( heading, index ) =>
					<div key={ `heading-${ index }` } className={ `table-of-content__item is-${ heading.attributes.nodeName }` }>
						{ heading.attributes.content && heading.attributes.content[ 0 ] } <strong>{ heading.attributes.nodeName }</strong>
					</div>
				) }
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
