import { type Observable } from 'lib0/observable';
import { type UndoManager, type Doc, type AbstractType } from 'yjs';

export class YMultiDocUndoManager extends Observable< string > {
	docs: Map< Doc, UndoManager >;
	trackedOrigins: Set< unknown >;
	undoStack: Array< UndoManager >;
	redoStack: Array< UndoManager >;

	constructor(
		typeScope?: AbstractType< any > | Array< AbstractType< any > >,
		opts?: NonNullable< ConstructorParameters< typeof UndoManager >[ 1 ] >
	);

	addToScope(
		ytypes: Array< AbstractType< any > > | AbstractType< any >
	): void;
	addTrackedOrigin( origin: unknown ): void;
	removeTrackedOrigin( origin: unknown ): void;
	undo(): unknown;
	redo(): unknown;
	clear( clearUndoStack?: boolean, clearRedoStack?: boolean ): void;
	stopCapturing(): void;
	canUndo(): boolean;
	canRedo(): boolean;
	destroy(): void;
}

/**
 * @deprecated Use YMultiDocUndoManager instead
 */
export { YMultiDocUndoManager as MultiDocUndoManager };
