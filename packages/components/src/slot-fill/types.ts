/**
 * External dependencies
 */
import type { Component, ReactNode, ReactElement } from 'react';

export type BaseSlotFillContext = {
	registerSlot: (
		name: string,
		slot: Component< SlotComponentProps >
	) => void;
	unregisterSlot: (
		name: string,
		slot: Component< SlotComponentProps >
	) => void;
	registerFill: ( name: string, instance: BaseFillObject ) => void;
	unregisterFill: ( name: string, instance: BaseFillObject ) => void;
	getSlot: ( name: string ) => Component< SlotComponentProps > | undefined;
	getFills: (
		name: string,
		slotInstance: Component< SlotComponentProps >
	) => BaseFillObject[];
	subscribe: ( listener: () => void ) => () => void;
};

export type BaseSlotProps = {
	name: string;
	fillProps?: any;
	children?: ( fills: ( string | ReactElement )[][] ) => ReactNode;
};

export type SlotComponentProps = {
	registerSlot: (
		name: string,
		slot: Component< SlotComponentProps >
	) => void;
	unregisterSlot: (
		name: string,
		slot: Component< SlotComponentProps >
	) => void;
	getFills: (
		name: string,
		slotInstance: Component< SlotComponentProps >
	) => BaseFillObject[];
} & BaseSlotProps;

export type BaseFillObject = {
	name: string;
	children?:
		| ReactElement
		| string
		| ( ( props: any ) => ReactElement | string );
};

export type FillComponentProps = {
	name: string;
	children?:
		| ReactElement
		| string
		| ( ( props: any ) => ReactElement | string );
};
