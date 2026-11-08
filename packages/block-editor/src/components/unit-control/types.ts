import type { ComponentPropsWithoutRef } from 'react';
import type { __experimentalUnitControl as BaseUnitControl } from '@wordpress/components';

/**
 * Props of the block editor `UnitControl`, which limits the units to the
 * theme's spacing units.
 */
export type UnitControlProps = ComponentPropsWithoutRef<
	typeof BaseUnitControl
>;
