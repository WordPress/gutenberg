/**
 * Internal dependencies
 */
import {
	useContextSystem,
	contextConnect,
	PolymorphicComponentProps,
} from '../ui/context';
import type { Props } from './types';
import { ElevationWrapper } from './styles';

function Elevation( props: PolymorphicComponentProps< Props, 'div', false > ) {
	const contextProps = useContextSystem( props, 'Elevation' );

	return <ElevationWrapper { ...contextProps } aria-hidden="true" />;
}

/**
 * `Elevation` is a core component that renders shadow, using the library's shadow system.
 *
 * The shadow effect is generated using the `value` prop.
 *
 * @example
 * ```jsx
 * import {
 *	__experimentalElevation as Elevation,
 *	__experimentalSurface as Surface,
 *	__experimentalText as Text,
 * } from '@wordpress/components';
 *
 * function Example() {
 * 	return (
 * 		<Surface>
 * 			<Text>Code is Poetry</Text>
 * 			<Elevation value={ 5 } />
 * 		</Surface>
 * 	);
 * }
 * ```
 */
const ConnectedElevation = contextConnect( Elevation, 'Elevation' );

export default ConnectedElevation;
