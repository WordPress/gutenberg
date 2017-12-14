/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createElement, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { hasBlockSupport } from '../api';
import { mapElements } from './utils';

// TODO: need redux state to get block -> footnote mapping

const FOOTNOTE_HREF_PREFIX = '#footnote-';

function isFootnoteAnchor( reactElement ) {
	return reactElement.type === 'a' && reactElement.props.href && reactElement.props.href.indexOf( FOOTNOTE_HREF_PREFIX ) === 0;
}

function addFootnoteNumbering( props, blockType ) {
	if ( hasBlockSupport( blockType, 'footnotes' ) ) {
		const children = mapElements( props.children, element => {
			if ( isFootnoteAnchor( element ) ) {
				const footnoteId = element.props.href.substring( FOOTNOTE_HREF_PREFIX.length );
				const sup = createElement( 'sup', {}, '[' + footnoteId + ']' );

				return cloneElement( element, { ...element.props, children: sup } );
			}
			return element;
		} );

		return { ...props, children };
	}

	return props;
}

function removeFootnoteNumbering( BlockEdit ) {
	return ( props ) => {
		if ( hasBlockSupport( props.name, 'footnotes' ) ) {
			const content = mapElements( props.attributes.content, element => {
				if ( isFootnoteAnchor( element ) ) {
					const sup = createElement( 'sup', {}, '[?]' );

					return cloneElement( element, { ...element.props, children: sup } );
				}
				return element;
			} );

			const newProps = { ...props, attributes: { ...props.attributes, content } };
			return <BlockEdit { ...newProps } />;
		}
		return <BlockEdit { ...props } />;
	};
}

export default function footnotes() {
	addFilter( 'blocks.getSaveContent.extraProps', 'core/footnotes', addFootnoteNumbering );
	addFilter( 'blocks.BlockEdit', 'core/footnotes', removeFootnoteNumbering );
}
