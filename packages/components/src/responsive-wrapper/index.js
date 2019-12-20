/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { cloneElement, Children } from '@wordpress/element';

function ResponsiveWrapper( {
	naturalWidth,
	naturalHeight,
	children,
	isInline = false,
} ) {
	if ( Children.count( children ) !== 1 ) {
		return null;
	}
	const imageStyle = {
		paddingBottom: ( naturalHeight / naturalWidth * 100 ) + '%',
	};
	const TagName = isInline ? 'span' : 'div';
	return (
		<TagName className="components-responsive-wrapper">
			<TagName style={ imageStyle } />
			{ cloneElement( children, {
				className: classnames( 'components-responsive-wrapper__content', children.props.className ),
			} ) }
		</TagName>
	);
}

export default ResponsiveWrapper;
