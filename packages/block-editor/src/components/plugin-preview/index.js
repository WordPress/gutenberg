/**
 * WordPress dependencies
 */
import {
	__experimentalUseSlot as useSlot,
	createSlotFill,
	Fill,
	MenuItem,
} from '@wordpress/components';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { coreDeviceTypes } from '../preview-options';

const {
	Fill: PluginPreviewMenuFill,
	Slot: PluginPreviewMenuSlot,
} = createSlotFill( 'PluginPreviewMenu' );

export { PluginPreviewMenuSlot };

/**
 * Component used to define a custom preview menu item and optional content.
 *
 * The children of this component will be displayed in the main area of the
 * block editor, instead of the `VisualEditor` component.
 *
 * The `title` and `icon` are used to populate the Preview menu item.
 *
 * @param {Object}    props          Component properties.
 * @param {WPElement} props.children Preview content.
 * @param {WPIcon}    props.icon     Menu item icon to be rendered.
 * @param {string}    props.name     A unique name of the custom preview.
 * @param {Function}  props.onClick  Menu item click handler, e.g. for previews
 *                                   that provide no content (`children`).
 * @param {string}    props.title    Menu item title.
 */
export default function PluginPreview( {
	children,
	icon,
	name,
	onClick,
	title,
	...props
} ) {
	const previewSlotName = `core/block-editor/plugin-preview/${ name }`;
	const previewSlot = useSlot( previewSlotName );

	if ( coreDeviceTypes.includes( name ) ) {
		return null;
	}

	return (
		<>
			<PluginPreviewMenuFill>
				{ ( { deviceType, setDeviceType } ) => (
					<MenuItem
						onClick={ ( ...args ) => {
							if ( name && previewSlot.fills?.length > 0 ) {
								setDeviceType( name );
							}
							if ( onClick ) {
								onClick( ...args );
							}
						} }
						icon={ icon || ( deviceType === name && check ) }
						{ ...props }
					>
						{ title }
					</MenuItem>
				) }
			</PluginPreviewMenuFill>
			{ children && <Fill name={ previewSlotName }>{ children }</Fill> }
		</>
	);
}
