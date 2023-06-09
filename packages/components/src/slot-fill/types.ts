/**
 * External dependencies
 */
import type { Component } from 'react';

export type BaseSlotFillContext = {
	registerSlot: ( name: string, slot: Component ) => void;
	unregisterSlot: ( name: string, slot: Component ) => void;
	registerFill: ( name: string, instance: any ) => void;
	unregisterFill: ( name: string, instance: any ) => void;
	getSlot: ( name: string ) => any;
	// TODO: getFill?
	getFills: ( name: string, slotInstance: any ) => any;
	subscribe: ( listener: () => {} ) => () => void;
};
