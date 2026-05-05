export type {
	CoreDataError,
	PostTypeFormData,
	PostTypeRecord,
	StoredConfig,
	StoredLabels,
	SupportFeature,
} from './types';

export {
	BLANK_RECORD,
	DEFAULT_SUPPORTS,
	SUPPORT_FEATURES,
	serializeForSave,
	toFormData,
	usePublicTaxonomies,
} from './utils';

export * from './fields';

export { default as activateAction } from './actions/activate';
export { default as deactivateAction } from './actions/deactivate';
export { default as deletePostTypeAction } from './actions/delete';
export { default as duplicatePostTypeAction } from './actions/duplicate';
export { createStatusAction, type StatusActionConfig } from './actions/utils';
