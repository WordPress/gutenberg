/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/components';
/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

export function withNext(
	CurrentComponent = () => null,
	NextComponent = () => null,
	namespace = 'Component',
	adapter = ( p ) => p
) {
	if ( process.env.COMPONENT_SYSTEM_PHASE === 1 ) {
		const WrappedComponent = ( props, ref ) => {
			const { __unstableVersion, ...otherProps } = useContextSystem(
				props,
				namespace
			);

			if ( __unstableVersion === 'next' ) {
				const nextProps = adapter( otherProps );
				return <NextComponent { ...nextProps } ref={ ref } />;
			}

			return <CurrentComponent { ...props } ref={ ref } />;
		};

		return contextConnect( WrappedComponent, namespace );
	}

	return forwardRef( CurrentComponent );
}
