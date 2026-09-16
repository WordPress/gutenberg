export type {
	EntitySyncAfterSaveContext,
	EntitySyncBeforeSaveContext,
	EntitySyncCollectionHandlers,
	EntitySyncEditOptions,
	EntitySyncManager,
	EntitySyncRecord,
	EntitySyncRecordHandlers,
	EntitySyncRecordId,
	EntitySyncUndoManager,
	EntitySyncUndoStackState,
} from './entity-sync';

export interface AnyFunction {
	( ...args: any[] ): any;
}
