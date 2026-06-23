/**
 * Internal dependencies
 */
/* Side-effect import: registers the bundled admin blocks (`core-admin/*`). */
import './admin-blocks';

export { AdminBlockRenderer } from './admin-block-renderer';
export { registerAdminBlock, getAdminBlock } from './registry';
export type {
	AdminBlockSpec,
	AdminBlockAttribute,
	AdminBlockComponentProps,
} from './types';
