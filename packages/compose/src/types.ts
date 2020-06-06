import type { ComponentType } from 'react';
export type Optionalize< T extends K, K > = Omit< T, keyof K >;
export type MapComponentFunction< P extends T, T = {} > = (
	component: ComponentType< P >
) => ComponentType< Optionalize< P, T > >;
