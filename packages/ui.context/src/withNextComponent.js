/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/context';

export function withNextComponent(
	CurrentComponent = () => null,
	NextComponent = () => null,
	adapter = ( p ) => p,
	namespace = 'Component'
) {
	const WrappedComponent = ( props, ref ) => {
		const { version, ...otherProps } = useContextSystem( props, namespace );

		if ( version === 'next' ) {
			const nextProps = adapter( otherProps );
			return <NextComponent { ...nextProps } ref={ ref } />;
		}

		return <CurrentComponent { ...otherProps } ref={ ref } />;
	};

	return contextConnect( WrappedComponent, namespace );
}
