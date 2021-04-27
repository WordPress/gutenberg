/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
import { useHStack } from '../h-stack';

/**
 *
 * @param {import('../context').ViewOwnProps<import('./types').Props, 'div'>} props
 */
export function useVStack( props ) {
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
