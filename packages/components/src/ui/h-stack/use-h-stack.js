/**
 * External dependencies
 */
import { hasNamespace, useContextSystem } from '@wp-g2/context';
import { css, cx, ui } from '@wp-g2/styles';
import { getValidChildren } from '@wp-g2/utils';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { FlexItem, useFlex } from '../flex';
import { getAlignmentProps } from './h-stack-utils';

/**
 *
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'div'>} props
 */
export function useHStack( props ) {
	const {
		alignment = 'edge',
		children,
		className,
		direction,
		spacing = 2,
		...otherProps
	} = useContextSystem( props, 'HStack' );

	const align = getAlignmentProps( alignment, direction );

	const validChildren = getValidChildren( children );
	const clonedChildren = validChildren.map(
		// @ts-ignore
		( /** @type {import('react').ReactElement} */ child, index ) => {
			const _key = child.key || `hstack-${ index }`;
			const _isSpacer = hasNamespace( child, [ 'Spacer' ] );

			if ( _isSpacer ) {
				return (
					<FlexItem
						isBlock
						key={ _key }
						{ ...child.props }
						{ ...ui.$( 'Spacer' ) }
					/>
				);
			}

			return child;
		}
	);

	const classes = useMemo( () => {
		return cx(
			css( {
				[ ui.createToken( 'HStackSpacing' ) ]: ui.space( spacing ),
			} ),
			className
		);
	}, [ className, spacing ] );

	const propsForFlex = {
		className: classes,
		children: clonedChildren,
		direction,
		justify: 'center',
		...align,
		...otherProps,
		gap: spacing,
	};

	const flexProps = useFlex( propsForFlex );

	return flexProps;
}
