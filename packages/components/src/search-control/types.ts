/**
 * External dependencies
 */
import type { KeyboardEventHandler } from 'react';

/**
 * WordPress dependencies
 */
import type { WPElement } from '@wordpress/element';

export type SearchControlProps = {
	className: string | undefined;
	onChange: ( arg0: string ) => {};
	onKeyDown: KeyboardEventHandler< HTMLInputElement >;
	value: string | number;
	label: string;
	placeholder: string | undefined;
	hideLabelFromVision: boolean | undefined;
	help: String | WPElement | undefined;
	onClose: Function;
};
