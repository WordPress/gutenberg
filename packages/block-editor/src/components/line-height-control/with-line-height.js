/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import {
	getLineHeightControlStyles,
	getLineHeightControlClassName,
} from './utils';

/**
 * Higher-order component that provides a Block's Edit/Save component with
 * interpolated className and style based on the lineHeight attribute value.
 */
export default function withLineHeight() {
	return ( WrappedComponent ) => {
		return function ComposedComponent( {
			attributes = {},
			className,
			style = {},
			...props
		} ) {
			const { lineHeight } = attributes;
			const lineHeightStyles = getLineHeightControlStyles( lineHeight );
			const lineHeightClassName = getLineHeightControlClassName(
				lineHeight
			);

			const classes = classnames( lineHeightClassName, className );
			const styles = { ...style, ...lineHeightStyles };

			return (
				<WrappedComponent
					{ ...props }
					attributes={ attributes }
					className={ classes }
					style={ styles }
				/>
			);
		};
	};
}
