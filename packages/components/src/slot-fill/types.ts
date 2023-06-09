/**
 * External dependencies
 */
import type { Component, ReactNode, ReactElement } from 'react';

export type BaseSlotFillContext = {
	registerSlot: ( name: string, slot: Component ) => void;
	unregisterSlot: ( name: string, slot: Component ) => void;
	registerFill: ( name: string, instance: BaseFillObject ) => void;
	unregisterFill: ( name: string, instance: BaseFillObject ) => void;
	getSlot: ( name: string ) => any;
	getFills: ( name: string, slotInstance: any ) => any;
	subscribe: ( listener: () => {} ) => () => void;
};

export type BaseSlotProps = {
	name: string;
	fillProps?: any;
	children?: ( fills: ( string | ReactElement )[][] ) => ReactNode;
};

export type SlotComponentProps = {
	registerSlot: ( name: string, slot: Component ) => void;
	unregisterSlot: ( name: string, slot: Component ) => void;
	getFills: ( name: string, slotInstance: Component ) => BaseFillObject[];
} & BaseSlotProps;

export type BaseFillObject = {
	name: string;
	children:
		| ReactElement
		| string
		| ( ( props: any ) => ReactElement | string );
};
