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
import styles from './blockquote.scss';

export const BlockQuote = ( props ) => {
	const newChildren = Children.map( props.children, ( child ) => {
		if ( child && child.props.identifier === 'value' ) {
			return cloneElement( child, {
				style: styles.quote,
			} );
		}
		if ( child && child.props.identifier === 'citation' ) {
			return cloneElement( child, {
				style: styles.citation,
			} );
		}
		return child;
	} );
	return <View>{ newChildren }</View>;
};
