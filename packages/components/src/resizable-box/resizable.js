/**
 * External dependencies
 */
import { Resizable as BaseResizabe } from 're-resizable';
import memoize from 'memize';

/*
 * This component enhances the original Resizable component from the
 * re-resizable library by adding unit parsing support for em and rem units.
 *
 * It does this by replacing the getStringSize utility, used within the
 * internal sizeStyle() method.
 */

/*
 * A utility used within getStringSize.
 */
const endsWith = memoize(
	( str, searchStr ) =>
		str.substr( str.length - searchStr.length, searchStr.length ) ===
		searchStr
);

/*
 * A modified version of getStringSize found within re-resizable.
 */
const getStringSize = memoize( ( n ) => {
	n = n.toString();
	if ( n === 'auto' ) {
		return n;
	}
	if ( endsWith( n, 'px' ) ) {
		return n;
	}
	if ( endsWith( n, '%' ) ) {
		return n;
	}
	if ( endsWith( n, 'vh' ) ) {
		return n;
	}
	if ( endsWith( n, 'vw' ) ) {
		return n;
	}
	if ( endsWith( n, 'vmax' ) ) {
		return n;
	}
	if ( endsWith( n, 'vmin' ) ) {
		return n;
	}
	// Enhancement: Add support for em.
	if ( endsWith( n, 'em' ) ) {
		return n;
	}
	// Enhancement: Add support for rem.
	if ( endsWith( n, 'rem' ) ) {
		return n;
	}
	return `${ n }px`;
} );

class Resizable extends BaseResizabe {
	/*
	 * Updating the sizeStyle() method in order to use our custom
	 * getStringSize() utility, with em + rem support.
	 *
	 * https://github.com/bokuweb/re-resizable/blob/master/src/index.tsx#L324
	 */
	get sizeStyle() {
		const { size } = this.props;
		const getSize = ( key ) => {
			if (
				typeof this.state[ key ] === 'undefined' ||
				this.state[ key ] === 'auto'
			) {
				return 'auto';
			}
			if (
				this.propsSize &&
				this.propsSize[ key ] &&
				endsWith( this.propsSize[ key ].toString(), '%' )
			) {
				if ( endsWith( this.state[ key ].toString(), '%' ) ) {
					return this.state[ key ].toString();
				}
				const parentSize = this.getParentSize();
				const value = Number(
					this.state[ key ].toString().replace( 'px', '' )
				);
				const percent = ( value / parentSize[ key ] ) * 100;
				return `${ percent }%`;
			}
			return getStringSize( this.state[ key ] );
		};
		const width =
			size && typeof size.width !== 'undefined' && ! this.state.isResizing
				? getStringSize( size.width )
				: getSize( 'width' );
		const height =
			size &&
			typeof size.height !== 'undefined' &&
			! this.state.isResizing
				? getStringSize( size.height )
				: getSize( 'height' );
		return { width, height };
	}
}

export default Resizable;
