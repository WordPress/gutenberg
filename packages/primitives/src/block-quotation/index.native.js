/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { Children, cloneElement, forwardRef } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './style.scss';

export const BlockQuotation = forwardRef( ( { ...props } ) => {
	const { style } = props;

	const blockQuoteStyle = [
		usePreferredColorSchemeStyle(
			styles.wpBlockQuoteLight,
			styles.wpBlockQuoteDark
		),
		style?.color && {
			borderLeftColor: style.color,
		},
		style,
	];
	const colorStyle = style?.color ? { color: style.color } : {};

	const newChildren = Children.map( props.children, ( child ) => {
		if ( child && child.props.identifier === 'citation' ) {
			return cloneElement( child, {
				style: {
					...styles.wpBlockQuoteCitation,
					...colorStyle,
				},
			} );
		}
		return child;
	} );
	return <View style={ blockQuoteStyle }>{ newChildren }</View>;
} );
