import { isValidElement, Children, createElement, cloneElement } from '@wordpress/element';
import { hasBlockSupport } from '../api';

// TODO: need redux state to get block -> footnote mapping

const FOOTNOTE_HREF_PREFIX = '#footnote-';

function isFootnoteAnchor( reactElement ) {
	return reactElement.type === 'a' && reactElement.props.href && reactElement.props.href.indexOf( FOOTNOTE_HREF_PREFIX ) === 0;
}

function numberChildrenFootnotes( children, getFootnoteNumber ) {
	return Children.map( children, child => {
		if ( ! isValidElement( child ) ) {
			return child;
		}

		if ( isFootnoteAnchor( child ) ) {
			const footnoteId = child.props.href.substring( FOOTNOTE_HREF_PREFIX.length );
			const sup = createElement( 'sup', {}, '[' + getFootnoteNumber( footnoteId ) + ']' );

			return cloneElement( child, { ...child.props, children: sup } );
		}

		const childProps = { ...child.props, children: numberChildrenFootnotes( child.props.children, getFootnoteNumber ) };

		return cloneElement( child, childProps );
	} );
}

function addFootnoteNumbering( props, blockType ) {
	if ( hasBlockSupport( blockType, 'footnotes' ) ) {
		const children = numberChildrenFootnotes( props.children, footnoteId => footnoteId );
		return { ...props, children };
	}

	return props;
}

function removeFootnoteNumbering( { edit, fragments }, props ) {
	if ( hasBlockSupport( props.name, 'footnotes' ) ) {
		return {
			edit: cloneElement( edit, { ...props, attributes: { ... props.attributes, content: numberChildrenFootnotes( props.attributes.content, () => '?' ) } } ),
			fragments,
		};
	}

	return { edit, fragments };
}

export default function footnotes( { addFilter } ) {
	addFilter( 'getSaveContent.extraProps', 'core-footnotes', addFootnoteNumbering );
	addFilter( 'BlockEdit', 'core-footnotes', removeFootnoteNumbering );
}
