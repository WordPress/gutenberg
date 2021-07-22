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
import { getValidChildren } from '../ui/utils/get-valid-children';

const { AspectRatioResizer, AspectRatioView } = styles;

function AspectRatio(
	props: PolymorphicComponentProps< AspectRatioProps, 'div' >,
	forwardedRef: import('react').Ref< any >
) {
	const {
		children,
		className,
		ratio = 1,
		width,
		...otherProps
	} = useContextSystem( props, 'AspectRatio' );
	const cx = useCx();

	const child = Children.only( children );
	const clonedChild =
		isValidElement( child ) &&
		cloneElement( child, {
			...child.props,
			className: cx( styles.content, child.props.className ),
		} );

	const classes = cx( css( { maxWidth: width } ), className );
	const resizerClasses = cx(
		css( {
			paddingBottom: `${ ( 1 / ratio ) * 100 }%`,
		} )
	);

	return (
		<AspectRatioView
			{ ...otherProps }
			className={ classes }
			ref={ forwardedRef }
		>
			{ clonedChild }
			<AspectRatioResizer aria-hidden className={ resizerClasses } />
		</AspectRatioView>
	);
}

export default contextConnect( AspectRatio, 'AspectRatio' );
