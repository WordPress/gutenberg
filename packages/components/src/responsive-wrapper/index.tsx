/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { cloneElement, Children } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ResponsiveWrapperProps } from './types';

/**
 * A wrapper component that maintains its aspect ratio when resized.
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
	if ( Children.count( children ) !== 1 ) {
		return null;
	}

	const TagName = isInline ? 'span' : 'div';
	let aspectRatio;
	if ( naturalWidth && naturalHeight ) {
		aspectRatio = `${ naturalWidth } / ${ naturalHeight }`;
	}

	const ch = children as React.ReactElement<
		Pick< React.HTMLAttributes< Element >, 'className' | 'style' >
	>;

	return (
		<TagName className="components-responsive-wrapper">
			<div>
				{ cloneElement( ch, {
					className: clsx(
						'components-responsive-wrapper__content',
						ch.props.className
					),
					style: {
						...ch.props.style,
						aspectRatio,
					},
				} ) }
			</div>
		</TagName>
	);
}

export default ResponsiveWrapper;
