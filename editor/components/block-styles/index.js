/**
 * External dependencies
 */
import { find, compact, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Toolbar } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';

function BlockStyles( { styles, className, onChangeClassName } ) {
	if ( ! styles ) {
		return;
	}

	let activeStyle;
	className
		.split( ' ' )
		.map( ( current ) => current.trim() )
		.filter( ( current ) => current.indexOf( 'is-style-' ) === 0 )
		.forEach( ( current ) => {
			if ( activeStyle ) {
				return;
			}
			const potentialStyleName = current.substring( 9 );
			activeStyle = find( styles, ( style ) => style.name === potentialStyleName );
		} );
	if ( ! activeStyle ) {
		activeStyle = find( styles, ( style ) => style.isDefault );
	}

	function updateClassName( style ) {
		let added = false;
		let updatedClassName = compact( className
			.split( ' ' )
			.map( ( current ) => {
				const trimmed = current.trim();
				if ( activeStyle && trimmed === 'is-style-' + activeStyle.name ) {
					added = true;
					return style.isDefault ? null : 'is-style-' + style.name;
				}
			} ) ).join( ' ' );
		if ( ! added && ! style.isDefault ) {
			updatedClassName = updatedClassName + ' is-style-' + style.name;
		}

		onChangeClassName( updatedClassName );
	}

	return (
		<Toolbar controls={ styles.map( ( variation ) => ( {
			icon: variation.icon,
			title: sprintf( __( 'Style %s' ), variation.label || variation.name ),
			isActive: activeStyle === variation,
			onClick() {
				updateClassName( variation );
			},
		} ) ) } />
	);
}

export default compose( [
	withSelect( ( select, { uid } ) => {
		const block = select( 'core/editor' ).getBlock( uid );

		return {
			className: block.attributes.className || '',
			styles: get( getBlockType( block.name ), [ 'transforms', 'styles' ] ),
		};
	} ),
	withDispatch( ( dispatch, { uid } ) => {
		return {
			onChangeClassName( newClassName ) {
				dispatch( 'core/editor' ).updateBlockAttributes( uid, { className: newClassName } );
			},
		};
	} ),
] )( BlockStyles );
