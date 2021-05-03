/**
 * External dependencies
 */
import { hasNamespace, useContextSystem } from '@wp-g2/context';
import { ui } from '@wp-g2/styles';
import { getValidChildren } from '@wp-g2/utils';

/**
 * Internal dependencies
 */
import { FlexItem, useFlex } from '../flex';
import { getAlignmentProps } from './utils';

/**
 *
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'div'>} props
 */
export function useHStack( props ) {
	const {
		alignment = 'edge',
		children,
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

	const propsForFlex = {
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
