/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

export function Link( props, ref ) {
	const {
		hasButtonAppearance,
		isPrimary,
		isLarge,
		isSmall,
		isToggled,
		isBusy,
		isBorderless,
		isDestructive,
		className,
		...additionalProps
	} = props;

	const classes = classnames( 'components-link', className, {
		'has-button-appearance': hasButtonAppearance,
		'is-borderless': isBorderless,
		'is-primary': isPrimary,
		'is-large': isLarge,
		'is-small': isSmall,
		'is-toggled': isToggled,
		'is-busy': isBusy,
		'is-destructive': isDestructive,
	} );

	// Disable reason: The anchor has content. It's not detected by jsx-a11y
	// because the `children` prop is included in the spread of `props`.

	/* eslint-disable jsx-a11y/anchor-has-content */
	return (
		<a
			ref={ ref }
			{ ...additionalProps }
			className={ classes }
		/>
	);
	/* eslint-enable jsx-a11y/anchor-has-content */
}

export default forwardRef( Link );
