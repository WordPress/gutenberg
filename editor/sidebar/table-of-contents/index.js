/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { filter } from 'lodash';
import classnames from 'classnames';

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
	const headings = filter( blocks, ( block ) =>
		block.name === 'core/title' || block.name === 'core/heading'
	);

	return (
		<PanelBody title={ __( 'Table of Contents (experimental)' ) } initialOpen={ false }>
			<div className="table-of-contents__items">
				{ headings.length > 1 && <p><strong>{ sprintf( '%d Headings', headings.length ) }</strong></p> }
				{ headings.map( ( heading, index ) =>
					<div
						key={ `heading-${ index }` }
						className={ classnames( 'table-of-contents__item', `is-${ heading.attributes.nodeName }`, {
							'is-invalid': (
								! heading.attributes.content ||
								heading.attributes.content.length === 0 ||
								( heading.name === 'core/title' && index )
							),
						} ) }
					>
						<strong>{ heading.attributes.nodeName || 'H1' }</strong>
						{ heading.attributes.content && heading.attributes.content.length > 0
							? heading.attributes.content
							: <em>{ __( '(Missing header text)' ) }</em>
						}
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
