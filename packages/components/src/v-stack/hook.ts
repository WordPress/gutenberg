/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../ui/context';
import { useHStack } from '../h-stack';
import type { VStackProps } from './types';

export function useVStack(
	props: WordPressComponentProps< VStackProps, 'div' >
) {
	const { expanded = false, ...otherProps } = useContextSystem(
		props,
		'VStack'
	);

	const hStackProps = useHStack( {
		direction: 'column',
		expanded,
		...otherProps,
	} );

	return hStackProps;
}
