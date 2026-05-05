/**
 * WordPress dependencies
 */
import { useSyncExternalStore } from '@wordpress/element';
import type { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import type { ImageEditingSession } from '../image-editing-session';

export interface ImageEditorExtensionPanelProps {
	/** Current image editing session. */
	session: ImageEditingSession;
}

export interface ImageEditorExtensionPanel {
	/** Unique extension panel identifier. */
	name: string;
	/** Tab label shown in the image editor sidebar. */
	title: string;
	/** Sort order within the extension panel group. */
	order?: number;
	/** Component rendered inside the extension sidebar panel. */
	component: ComponentType< ImageEditorExtensionPanelProps >;
}

type Listener = () => void;

const panels = new Map< string, ImageEditorExtensionPanel >();
const listeners = new Set< Listener >();
let snapshot: ImageEditorExtensionPanel[] = [];

function updateSnapshot() {
	snapshot = [ ...panels.values() ].sort( ( a, b ) => {
		const order = ( a.order ?? 10 ) - ( b.order ?? 10 );
		if ( order !== 0 ) {
			return order;
		}
		return a.name.localeCompare( b.name );
	} );
	for ( const listener of listeners ) {
		listener();
	}
}

function subscribe( listener: Listener ) {
	listeners.add( listener );
	return () => {
		listeners.delete( listener );
	};
}

function getSnapshot() {
	return snapshot;
}

export function registerImageEditorExtensionPanel(
	panel: ImageEditorExtensionPanel
) {
	if ( ! panel.name ) {
		throw new Error( 'Image editor extension panels must include a name.' );
	}
	if ( panels.has( panel.name ) ) {
		throw new Error(
			`Image editor extension panel "${ panel.name }" is already registered.`
		);
	}
	panels.set( panel.name, panel );
	updateSnapshot();
	return () => {
		if ( panels.get( panel.name ) !== panel ) {
			return;
		}
		panels.delete( panel.name );
		updateSnapshot();
	};
}

export function useImageEditorExtensionPanels() {
	return useSyncExternalStore( subscribe, getSnapshot, getSnapshot );
}
