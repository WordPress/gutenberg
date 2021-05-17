/**
 * WordPress dependencies
 */
import {
	cloneElement,
	createElement,
	Component,
	isValidElement,
} from '@wordpress/element';
import { SVG, Path, Circle, Rect } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';

const ALLOWED_TAGS_AND_ATTRIBUTES = {
	svg: {
		component: SVG,
		attributes: [
			'xlmns',
			'width',
			'height',
			'viewBox',
			'version',
			'role',
			'aria-hidden',
			'focusable',
		],
	},
	path: { component: Path, attributes: [ 'd' ] },
	circle: { component: Circle, attributes: [ 'cx', 'cy', 'r' ] },
	rect: { component: Rect, attributes: [ 'width', 'height', 'x', 'y' ] },
};

function iconStringToSVGComponent( iconString ) {
	//TODO: replace with parser that works in all contexts (not just web)
	//TODO: wp_kses variation icon to allowlist svg and path, or appropriate XSS shielding
	const parser = new window.DOMParser();
	const document = parser.parseFromString( iconString, 'image/svg+xml' );
	return svgNodeToComponent( document.children?.[ 0 ] ) ?? null;
}

function svgNodeToComponent( node ) {
	const children = [];
	for ( const child of node.children ) {
		const childNode = svgNodeToComponent( child );
		if ( childNode ) {
			children.push( childNode );
		}
	}
	const tag = ALLOWED_TAGS_AND_ATTRIBUTES[ node.nodeName ];
	if ( tag ) {
		//TODO: React Lists need a unique key, maybe just use uniqueId instead.
		const props = { key: `${ node.nodeName }-${ Date.now() }` };
		for ( const attribute of tag.attributes ) {
			props[ attribute ] = node.getAttribute( attribute );
		}
		return createElement( tag.component, props, children );
	}
}

function Icon( { icon = null, size, ...additionalProps } ) {
	if ( 'string' === typeof icon ) {
		if ( icon.startsWith( '<svg' ) ) {
			return iconStringToSVGComponent( icon );
		}
		return <Dashicon icon={ icon } { ...additionalProps } />;
	}

	if ( icon && Dashicon === icon.type ) {
		return cloneElement( icon, {
			...additionalProps,
		} );
	}

	// Icons should be 24x24 by default.
	const iconSize = size || 24;
	if ( 'function' === typeof icon ) {
		if ( icon.prototype instanceof Component ) {
			return createElement( icon, {
				size: iconSize,
				...additionalProps,
			} );
		}

		return icon( { size: iconSize, ...additionalProps } );
	}

	if ( icon && ( icon.type === 'svg' || icon.type === SVG ) ) {
		const appliedProps = {
			width: iconSize,
			height: iconSize,
			...icon.props,
			...additionalProps,
		};

		return <SVG { ...appliedProps } />;
	}

	if ( isValidElement( icon ) ) {
		return cloneElement( icon, {
			size: iconSize,
			...additionalProps,
		} );
	}

	return icon;
}

export default Icon;
