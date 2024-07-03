/**
 * Internal dependencies
 */
import type { WordPressPolymorphicComponentProps } from '../context';
import { useContextSystem } from '../context';
import { useHStack } from '../h-stack';
import type { VStackProps } from './types';

export function useVStack(
	props: WordPressPolymorphicComponentProps< VStackProps, 'div' >
) {
	const {
		expanded = false,
		alignment = 'stretch',
		...otherProps
	} = useContextSystem( props, 'VStack' );

	const hStackProps = useHStack( {
		direction: 'column',
		expanded,
		alignment,
		...otherProps,
	} );

	return hStackProps;
}
