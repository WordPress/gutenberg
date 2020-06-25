/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { Children, cloneElement } from '@wordpress/element';
/**
 * Internal dependencies
 */
import styles from './style.scss';

export const BlockQuotation = ( props ) => {
	const newChildren = Children.map( props.children, ( child ) => {
		if ( child && child.props.identifier === 'citation' ) {
			return cloneElement( child, {
				style: styles.wpBlockQuoteCitation,
			} );
		}
		if ( child && child.props.identifier === 'value' ) {
			return cloneElement( child, { tagsToEliminate: [ 'div' ] } );
		}
		return child;
	} );
	return <View style={ styles.wpBlockQuote }>{ newChildren }</View>;
};
