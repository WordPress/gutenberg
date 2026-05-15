/**
 * Internal dependencies
 */
import type { WithPermissions } from './use-entity-records';

/**
 * Utility type that adds permissions to any record type.
 */
export type { WithPermissions };
export {
	default as useEntityRecord,
	useDeprecatedEntityRecord as __experimentalUseEntityRecord,
} from './use-entity-record';
export {
	default as useEntityRecords,
	useDeprecatedEntityRecords as __experimentalUseEntityRecords,
} from './use-entity-records';
export {
	default as useResourcePermissions,
	useDeprecatedResourcePermissions as __experimentalUseResourcePermissions,
} from './use-resource-permissions';
export { default as useEntityBlockEditor } from './use-entity-block-editor';
export { default as useEntityId } from './use-entity-id';
export { default as useEntityProp } from './use-entity-prop';
