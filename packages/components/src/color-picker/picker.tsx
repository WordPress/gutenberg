/**
 * External dependencies
 */
import { RgbStringColorPicker, RgbaStringColorPicker } from 'react-colorful';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useMemo, useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { PickerProps } from './types';

export const Picker = ( { color, enableAlpha, onChange }: PickerProps ) => {
	const Component = enableAlpha
		? RgbaStringColorPicker
		: RgbStringColorPicker;
	const rgbColor = useMemo( () => color.toRgbString(), [ color ] );

	useEffect( () => {
		const iframe = document.querySelector(
			'iframe'
		) as HTMLIFrameElement | null;
		const picker = document.querySelector( '.react-colorful__saturation' );

		if ( ! picker || ! iframe ) {
			return;
		}

		const restoreIframePointerEvents = () => {
			iframe.style.pointerEvents = '';
			window.removeEventListener(
				'pointerup',
				restoreIframePointerEvents
			);
		};
		// iframe elements represent a separate window, and therefore any pointer
		// event happening on top on an iframe is not registered correctly from the
		// color picker. Disabling pointer events on the iframe prevents this
		// issue from happening.
		const disableIframePointerEvents = () => {
			iframe.style.pointerEvents = 'none';
			window.addEventListener( 'pointerup', restoreIframePointerEvents );
		};

		picker.addEventListener( 'pointerdown', disableIframePointerEvents );

		return () => {
			picker.removeEventListener(
				'pointerdown',
				disableIframePointerEvents
			);
			picker.removeEventListener(
				'pointerup',
				restoreIframePointerEvents
			);
		};
	}, [] );

	return (
		<Component
			color={ rgbColor }
			onChange={ ( nextColor ) => {
				onChange( colord( nextColor ) );
			} }
		/>
	);
};
