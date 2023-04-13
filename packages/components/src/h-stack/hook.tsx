/**
 * External dependencies
 */
import type { ReactElement } from 'react';

/**
 * Internal dependencies
 */
import {
	hasConnectNamespace,
	useContextSystem,
	WordPressComponentProps,
} from '../ui/context';
import { FlexItem, useFlex } from '../flex';
import { getAlignmentProps } from './utils';
import { getValidChildren } from '../ui/utils/get-valid-children';
import type { Props } from './types';

export function useHStack( props: WordPressComponentProps< Props, 'div' > ) {
	const {
		alignment = 'edge',
		children,
		direction,
		spacing = 2,
		...otherProps
	} = useContextSystem( props, 'HStack' );

	const align = getAlignmentProps( alignment, direction );

	const validChildren = getValidChildren( children );
	const clonedChildren = validChildren.map( ( child, index ) => {
		const _isSpacer = hasConnectNamespace( child, [ 'Spacer' ] );

		if ( _isSpacer ) {
			const childElement = child as ReactElement;
			const _key = childElement.key || `hstack-${ index }`;

			return <FlexItem isBlock key={ _key } { ...childElement.props } />;
		}

		return child;
	} );

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
