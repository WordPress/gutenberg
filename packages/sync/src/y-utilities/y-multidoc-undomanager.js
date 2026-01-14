// File copied as is from the y-utilities package.
/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
// @ts-nocheck
/* eslint-env browser */

import * as array from 'lib0/array';
import * as map from 'lib0/map';
import { Observable } from 'lib0/observable';
import * as Y from 'yjs';

/**
 * @param {YMultiDocUndoManager} mum
 * @param {'undo' | 'redo'} type
 */
const popStackItem = ( mum, type ) => {
	const stack = type === 'undo' ? mum.undoStack : mum.redoStack;
	while ( stack.length > 0 ) {
		const um = /** @type {Y.UndoManager} */ ( stack.pop() );
		const prevUmStack = type === 'undo' ? um.undoStack : um.redoStack;
		const stackItem = /** @type {any} */ ( prevUmStack.pop() );
		let actionPerformed = false;
		if ( type === 'undo' ) {
			um.undoStack = [ stackItem ];
			actionPerformed = um.undo() !== null;
			um.undoStack = prevUmStack;
		} else {
			um.redoStack = [ stackItem ];
			actionPerformed = um.redo() !== null;
			um.redoStack = prevUmStack;
		}
		if ( actionPerformed ) {
			return stackItem;
		}
	}
	return null;
};

/**
 * @extends Observable<any>
 */
export class YMultiDocUndoManager extends Observable {
	/**
	 * @param {Y.AbstractType<any>|Array<Y.AbstractType<any>>} typeScope Accepts either a single type, or an array of types
	 * @param {ConstructorParameters<typeof Y.UndoManager>[1]} opts
	 */
	constructor( typeScope = [], opts = {} ) {
		super();
		/**
		 * @type {Map<Y.Doc, Y.UndoManager>}
		 */
		this.docs = new Map();
		this.trackedOrigins = opts.trackedOrigins || new Set( [ null ] );
		opts.trackedOrigins = this.trackedOrigins;
		this._defaultOpts = opts;
		/**
		 * @type {Array<Y.UndoManager>}
		 */
		this.undoStack = [];
		/**
		 * @type {Array<Y.UndoManager>}
		 */
		this.redoStack = [];
		this.addToScope( typeScope );
	}

	/**
	 * @param {Array<Y.AbstractType<any>> | Y.AbstractType<any>} ytypes
	 */
	addToScope( ytypes ) {
		ytypes = array.isArray( ytypes ) ? ytypes : [ ytypes ];
		ytypes.forEach( ( ytype ) => {
			const ydoc = /** @type {Y.Doc} */ ( ytype.doc );
			const um = map.setIfUndefined( this.docs, ydoc, () => {
				const um = new Y.UndoManager( [ ytype ], this._defaultOpts );
				um.on(
					'stack-cleared',
					/** @param {any} opts */ ( {
						undoStackCleared,
						redoStackCleared,
					} ) => {
						this.clear( undoStackCleared, redoStackCleared );
					}
				);
				ydoc.on( 'destroy', () => {
					this.docs.delete( ydoc );
					this.undoStack = this.undoStack.filter(
						( um ) => um.doc !== ydoc
					);
					this.redoStack = this.redoStack.filter(
						( um ) => um.doc !== ydoc
					);
				} );
				um.on(
					'stack-item-added',
					/** @param {any} change */ ( change ) => {
						const stack =
							change.type === 'undo'
								? this.undoStack
								: this.redoStack;
						stack.push( um );
						this.emit( 'stack-item-added', [
							{ ...change, ydoc: ydoc },
							this,
						] );
					}
				);
				um.on(
					'stack-item-updated',
					/** @param {any} change */ ( change ) => {
						this.emit( 'stack-item-updated', [
							{ ...change, ydoc },
							this,
						] );
					}
				);
				um.on(
					'stack-item-popped',
					/** @param {any} change */ ( change ) => {
						this.emit( 'stack-item-popped', [
							{ ...change, ydoc },
							this,
						] );
					}
				);
				// if doc is destroyed
				// emit events from um to multium
				return um;
			} );
			/* c8 ignore next 4 */
			if ( um.scope.every( ( yt ) => yt !== ytype ) ) {
				um.scope.push( ytype );
			}
		} );
	}

	/**
	 * @param {any} origin
	 */
	/* c8 ignore next 3 */
	addTrackedOrigin( origin ) {
		this.trackedOrigins.add( origin );
	}

	/**
	 * @param {any} origin
	 */
	/* c8 ignore next 3 */
	removeTrackedOrigin( origin ) {
		this.trackedOrigins.delete( origin );
	}

	/**
	 * Undo last changes on type.
	 *
	 * @return {any?} Returns StackItem if a change was applied
	 */
	undo() {
		return popStackItem( this, 'undo' );
	}

	/**
	 * Redo last undo operation.
	 *
	 * @return {any?} Returns StackItem if a change was applied
	 */
	redo() {
		return popStackItem( this, 'redo' );
	}

	clear( clearUndoStack = true, clearRedoStack = true ) {
		/* c8 ignore next */
		if (
			( clearUndoStack && this.canUndo() ) ||
			( clearRedoStack && this.canRedo() )
		) {
			this.docs.forEach( ( um ) => {
				/* c8 ignore next */
				clearUndoStack && ( this.undoStack = [] );
				/* c8 ignore next */
				clearRedoStack && ( this.redoStack = [] );
				um.clear( clearUndoStack, clearRedoStack );
			} );
			this.emit( 'stack-cleared', [
				{
					undoStackCleared: clearUndoStack,
					redoStackCleared: clearRedoStack,
				},
			] );
		}
	}

	/* c8 ignore next 5 */
	stopCapturing() {
		this.docs.forEach( ( um ) => {
			um.stopCapturing();
		} );
	}

	/**
	 * Are undo steps available?
	 *
	 * @return {boolean} `true` if undo is possible
	 */
	canUndo() {
		return this.undoStack.length > 0;
	}

	/**
	 * Are redo steps available?
	 *
	 * @return {boolean} `true` if redo is possible
	 */
	canRedo() {
		return this.redoStack.length > 0;
	}

	destroy() {
		this.docs.forEach( ( um ) => um.destroy() );
		super.destroy();
	}
}

/**
 * @todo remove
 * @deprecated Use YMultiDocUndoManager instead
 */
export const MultiDocUndoManager = YMultiDocUndoManager;
