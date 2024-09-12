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

export const BlockQuotation = forwardRef( ( { ...props }, ref ) => {
	const { style } = props;

	const blockQuoteStyle = [
		usePreferredColorSchemeStyle(
			styles.wpBlockQuoteLight,
			styles.wpBlockQuoteDark
		),
		style?.baseColors?.color?.text && {
			borderLeftColor: style.baseColors.color.text,
		},
		style?.color && {
			borderLeftColor: style.color,
		},
		style,
		style?.backgroundColor && styles.paddingWithBackground,
	];
	const colorStyle = style?.color ? { color: style.color } : {};

	const newChildren = Children.map( props.children, ( child ) => {
		const { identifier, attributeKey } = child?.props || {};
		const identifierKey = identifier ?? attributeKey;

		if ( identifierKey === 'citation' ) {
			return cloneElement( child, {
				style: {
					...styles.wpBlockQuoteCitation,
					...colorStyle,
				},
			} );
		}
		if ( child && child.props.identifier === 'value' ) {
			return cloneElement( child, {
				tagsToEliminate: [ 'div' ],
				style: colorStyle,
			} );
		}
		return child;
	} );
	return (
		<View ref={ ref } style={ blockQuoteStyle }>
			{ newChildren }
		</View>
	);
} );
