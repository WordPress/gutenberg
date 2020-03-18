/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { Children, cloneElement } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import styles from './style.scss';

export const BlockQuotation = withPreferredColorScheme( ( props ) => {
	const { getStylesFromColorScheme } = props;

	const blockQuoteStyle = getStylesFromColorScheme(
		styles.wpBlockQuoteLight,
		styles.wpBlockQuoteDark
	);

	const newChildren = Children.map( props.children, ( child ) => {
		if ( child && child.props.identifier === 'citation' ) {
			return cloneElement( child, {
				style: styles.wpBlockQuoteCitation,
			} );
		}
		if ( child && child.props.identifier === 'value' ) {
			return cloneElement( child, {
				tagsToEliminate: [ 'div' ],
				style: styles.wpBlockQuoteValue,
			} );
		}
		return child;
	} );
	return <View style={ blockQuoteStyle }>{ newChildren }</View>;
} );
