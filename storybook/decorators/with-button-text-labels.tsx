import type { Decorator } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { createRegistry, RegistryProvider, useRegistry } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

function WithButtonTextLabelsPreference( {
	children,
}: {
	children: ReactNode;
} ) {
	const parentRegistry = useRegistry();
	const registry = useMemo( () => {
		const subRegistry = createRegistry( {}, parentRegistry );
		subRegistry.register( preferencesStore );
		subRegistry
			.dispatch( preferencesStore )
			.set( 'core', 'showIconLabels', true );
		return subRegistry;
	}, [ parentRegistry ] );

	return (
		<RegistryProvider value={ registry }>
			<div className="show-icon-labels">{ children }</div>
		</RegistryProvider>
	);
}

export const WithButtonTextLabels: Decorator = ( Story, context ) => {
	if ( context.viewMode !== 'docs' ) {
		return <Story { ...context } />;
	}

	return (
		<>
			<Story { ...context } />
			<div style={ { marginTop: '24px' } }>
				<strong>Show button text labels</strong>
				<WithButtonTextLabelsPreference>
					<Story { ...context } />
				</WithButtonTextLabelsPreference>
			</div>
		</>
	);
};
