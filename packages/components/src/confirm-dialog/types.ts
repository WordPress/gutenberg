/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { MouseEvent, KeyboardEvent } from 'react';

export type DialogInputEvent =
	| KeyboardEvent< HTMLDivElement >
	| MouseEvent< HTMLButtonElement >;

interface BaseProps {
	title?: string;
	message: React.ReactNode;
	onConfirm: ( event: DialogInputEvent ) => void;
	onCancel?: ( event: DialogInputEvent ) => void;
}

interface ControlledProps extends BaseProps {
	isOpen: boolean;
}

interface UncontrolledProps extends BaseProps {
	isOpen?: undefined;
}

export type OwnProps = ControlledProps | UncontrolledProps;
