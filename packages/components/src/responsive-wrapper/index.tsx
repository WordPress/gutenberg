/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { cloneElement, Children } from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';

function ResponsiveWrapper( {
	naturalWidth,
	naturalHeight,
	children,
	isInline = false,
} ) {
	const [ containerResizeListener, { width: containerWidth } ] =
		useResizeObserver();
	if ( Children.count( children ) !== 1 ) {
		return null;
	}
	const imageStyle = {
		paddingBottom:
			naturalWidth < containerWidth
				? naturalHeight
				: ( naturalHeight / naturalWidth ) * 100 + '%',
	};
	const TagName = isInline ? 'span' : 'div';
	return (
		<TagName className="components-responsive-wrapper">
			{ containerResizeListener }
			<TagName style={ imageStyle } />
			{ cloneElement( children, {
				className: classnames(
					'components-responsive-wrapper__content',
					children.props.className
				),
			} ) }
		</TagName>
	);
}

export default ResponsiveWrapper;
