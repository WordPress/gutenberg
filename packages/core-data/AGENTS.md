## Synchronization

`SyncConfig.getChangesFromCRDTDoc` implementations must compare CRDT values with the edited entity record and return only properties that actually changed. Returning a whole deserialized record, or fresh object values that are equal to the current values, creates spurious edits and can leave the entity permanently dirty.
