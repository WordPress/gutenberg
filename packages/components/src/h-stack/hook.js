/**
 * Internal dependencies
 */
// import { hasConnectNamespace } from '../ui/context';
import { FlexItem, useFlex } from '../flex';
import { getAlignmentProps } from './utils';
import { getValidChildren } from '../ui/utils/get-valid-children';

/**
 *
 * @param {import('../ui/context').WordPressComponentProps<import('./types').Props, 'div'>} props
 */
export function useHStack( props ) {
	const {
		alignment = 'edge',
		children,
		direction,
		spacing = 2,
		...otherProps
	} = props;

	const align = getAlignmentProps( alignment, direction );

	const validChildren = getValidChildren( children );
	const clonedChildren = validChildren.map(
		// @ts-ignore
		( /** @type {import('react').ReactElement} */ child, index ) => {
			const _key = child.key || `hstack-${ index }`;
			const _isSpacer = false; //hasConnectNamespace( child, [ 'Spacer' ] );

			if ( _isSpacer ) {
				return <FlexItem isBlock key={ _key } { ...child.props } />;
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
