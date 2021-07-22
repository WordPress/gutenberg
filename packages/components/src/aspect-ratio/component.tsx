/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { Children, cloneElement, isValidElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	PolymorphicComponentProps,
} from '../ui/context';
import type { AspectRatioProps } from './types';
import * as styles from './styles';
import { useCx } from '../utils/hooks';

const { AspectRatioView } = styles;

function AspectRatio(
	props: PolymorphicComponentProps< AspectRatioProps, 'div' >,
	forwardedRef: import('react').Ref< any >
) {
	const {
		children,
		className,
		ratio = 'auto',
		width,
		...otherProps
	} = useContextSystem( props, 'AspectRatio' );
	const cx = useCx();
	const child = Children.only( children );
	const clonedChild =
		isValidElement( child ) &&
		cloneElement( child, {
			...child.props,
			className: cx(
				styles.content,
				/**
				 * We need to use string interpolation here, as this value
				 * is passed through emotion serialization and `aspectRatio`
				 * is not considered a unitless value. This results in adding
				 * a `px` suffix, making the value invalid.
				 *
				 * @see https://github.com/emotion-js/emotion/blob/main/packages/unitless/src/index.js
				 */
				css( { aspectRatio: `${ ratio }` } ),
				child.props.className
			),
		} );
	const classes = cx( css( { maxWidth: width } ), className );
	return (
		<AspectRatioView
			{ ...otherProps }
			className={ classes }
			ref={ forwardedRef }
		>
			{ clonedChild }
		</AspectRatioView>
	);
}

export default contextConnect( AspectRatio, 'AspectRatio' );
