/**
 * External dependencies
 */
import classnames from 'classnames';

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
	children,
	isInline = false,
}: ResponsiveWrapperProps ) {
	if ( Children.count( children ) !== 1 ) {
		return null;
	}

	const TagName = isInline ? 'span' : 'div';
	return (
		<TagName className="components-responsive-wrapper">
			<TagName />
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
