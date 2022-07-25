/**
 * External dependencies
 */
import type { KeyboardEventHandler } from 'react';

/**
 * WordPress dependencies
 */
import type { WPElement } from '@wordpress/element';

export type SearchControlProps = {
	className?: string;
	onChange: ( arg0: string ) => {};
	onKeyDown: KeyboardEventHandler< HTMLInputElement >;
	value: string | number;
	label: string;
	placeholder?: string;
	hideLabelFromVision?: boolean;
	help?: string | WPElement;
	onClose: VoidFunction;
};
