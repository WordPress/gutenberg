/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { cloneElement, Children } from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { ResponsiveWrapperProps } from './types';

function ResponsiveWrapper( {
	naturalWidth,
	naturalHeight,
	children,
	isInline = false,
}: ResponsiveWrapperProps ) {
	const [ containerResizeListener, { width: containerWidth } ] =
		useResizeObserver();
	if ( Children.count( children ) !== 1 ) {
		return null;
	}
	const imageStyle = {
		paddingBottom:
			naturalWidth < ( containerWidth ?? 0 )
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
