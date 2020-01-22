/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import VisuallyHidden from '../visually-hidden';

export default function BaseControlVisualLabel( {
	as = 'span',
	className,
	children,
	htmlFor: htmlForProp,
	hideLabelFromVision = false,
} ) {
	const showFor = as === 'label';
	const htmlFor = showFor ? htmlForProp : undefined;

	if ( hideLabelFromVision ) {
		return (
			<VisuallyHidden as="label" htmlFor={ htmlFor }>
				{ children }
			</VisuallyHidden>
		);
	}

	const classes = classnames( 'components-base-control__label', className );
	const Component = as;

	return (
		<Component className={ classes } htmlFor={ htmlFor }>
			{ children }
		</Component>
	);
}
