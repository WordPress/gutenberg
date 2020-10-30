/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/context';

export function withNextComponent(
	CurrentComponent = () => null,
	NextComponent = () => null,
	namespace = 'Component',
	adapter = ( p ) => p
) {
	const WrappedComponent = ( props, ref ) => {
		const { version, ...otherProps } = useContextSystem( props, namespace );

		if ( version === 'next' ) {
			const nextProps = adapter( otherProps );
			return <NextComponent { ...nextProps } ref={ ref } />;
		}

		return <CurrentComponent { ...props } ref={ ref } />;
	};

	return contextConnect( WrappedComponent, namespace );
}
