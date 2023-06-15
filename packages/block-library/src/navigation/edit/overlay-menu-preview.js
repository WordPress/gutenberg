/**
 * WordPress dependencies
 */
import {
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import OverlayMenuIcon from './overlay-menu-icon';

export default function OverlayMenuPreview( { setAttributes, hasIcon, icon } ) {
	// get the icons from the block editor settings via a useSelect.
	// they are under the key "navigationBlockOverlayIcons"

	const navigationBlockOverlayIcons = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()
				.navigationBlockOverlayIcons,
		[]
	);

	return (
		<>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Show icon button' ) }
				help={ __(
					'Configure the visual appearance of the button opening the overlay menu.'
				) }
				onChange={ ( value ) => setAttributes( { hasIcon: value } ) }
				checked={ hasIcon }
			/>

			<ToggleGroupControl
				__nextHasNoMarginBottom
				label={ __( 'Icon' ) }
				value={ icon }
				onChange={ ( value ) => setAttributes( { icon: value } ) }
				isBlock
			>
				{ navigationBlockOverlayIcons.map(
					( { label, icon: _icon } ) => (
						<ToggleGroupControlOption
							key={ _icon }
							value={ _icon }
							aria-label={ label }
							label={ <OverlayMenuIcon icon={ _icon } /> }
						/>
					)
				) }
			</ToggleGroupControl>
		</>
	);
}
