/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import OverlayMenuIcon from './overlay-menu-icon';

export default function OverlayMenuPreview( {
	setAttributes,
	overlayOpenButtonDisplay,
	icon,
} ) {
	const showIconPicker = overlayOpenButtonDisplay !== 'text';

	return (
		<>
			<ToolsPanelItem
				label={ __( 'Display Mode' ) }
				isShownByDefault
				hasValue={ () => overlayOpenButtonDisplay !== undefined }
				onDeselect={ () =>
					setAttributes( {
						overlayOpenButtonDisplay: undefined,
					} )
				}
			>
				<ToggleGroupControl
					__next40pxDefaultSize
					label={ __( 'Display Mode' ) }
					value={ overlayOpenButtonDisplay ?? 'icon' }
					onChange={ ( value ) =>
						setAttributes( {
							overlayOpenButtonDisplay: value,
						} )
					}
					isBlock
				>
					<ToggleGroupControlOption
						value="icon"
						label={ __( 'Icon' ) }
					/>
					<ToggleGroupControlOption
						value="text"
						label={ __( 'Text' ) }
					/>
					<ToggleGroupControlOption
						value="both"
						label={ __( 'Both' ) }
					/>
				</ToggleGroupControl>
			</ToolsPanelItem>

			{ showIconPicker && (
				<ToolsPanelItem
					label={ __( 'Icon' ) }
					isShownByDefault
					hasValue={ () => icon !== 'handle' }
					onDeselect={ () => setAttributes( { icon: 'handle' } ) }
				>
					<ToggleGroupControl
						__next40pxDefaultSize
						className="wp-block-navigation__overlay-menu-icon-toggle-group"
						label={ __( 'Icon' ) }
						value={ icon }
						onChange={ ( value ) =>
							setAttributes( { icon: value } )
						}
						isBlock
					>
						<ToggleGroupControlOption
							value="handle"
							aria-label={ __( 'handle' ) }
							label={ <OverlayMenuIcon icon="handle" /> }
						/>
						<ToggleGroupControlOption
							value="menu"
							aria-label={ __( 'menu' ) }
							label={ <OverlayMenuIcon icon="menu" /> }
						/>
					</ToggleGroupControl>
				</ToolsPanelItem>
			) }
		</>
	);
}
