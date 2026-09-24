import clsx from 'clsx';
import deprecated from '@wordpress/deprecated';
import { cloneElement, Children } from '@wordpress/element';
import type { ResponsiveWrapperProps } from './types';

/**
 * A wrapper component that maintains its aspect ratio when resized.
 *
 * This component is deprecated. Use the CSS `aspect-ratio` property instead.
 *
 * @deprecated
 *
 * ```jsx
 * import { ResponsiveWrapper } from '@wordpress/components';
 *
 * const MyResponsiveWrapper = () => (
 * 	<ResponsiveWrapper naturalWidth={ 2000 } naturalHeight={ 680 }>
 * 		<img
 * 			src="https://s.w.org/style/images/about/WordPress-logotype-standard.png"
 * 			alt="WordPress"
 * 		/>
 * 	</ResponsiveWrapper>
 * );
 * ```
 */
function ResponsiveWrapper( {
	naturalWidth,
	naturalHeight,
	children,
	isInline = false,
}: ResponsiveWrapperProps ) {
	deprecated( 'wp.components.ResponsiveWrapper', {
		since: '7.2',
		version: '7.4',
		alternative: 'the CSS aspect-ratio property',
	} );

	if ( Children.count( children ) !== 1 ) {
		return null;
	}

	const TagName = isInline ? 'span' : 'div';
	let aspectRatio;
	if ( naturalWidth && naturalHeight ) {
		aspectRatio = `${ naturalWidth } / ${ naturalHeight }`;
	}

	return (
		<TagName className="components-responsive-wrapper">
			<div>
				{ cloneElement( children, {
					className: clsx(
						'components-responsive-wrapper__content',
						children.props.className
					),
					style: {
						...children.props.style,
						aspectRatio,
					},
				} ) }
			</div>
		</TagName>
	);
}

export default ResponsiveWrapper;
