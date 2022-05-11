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
	const { ref, width: containerWidth } = useResizeObserver( {} );
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
		<TagName ref={ ref } className="components-responsive-wrapper">
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
