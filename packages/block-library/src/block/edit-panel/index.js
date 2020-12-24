/**
 * WordPress dependencies
 */
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/** @typedef {import('@wordpress/element').WPComponent} WPComponent */

/**
 * ReusableBlockEditPanel props.
 *
 * @typedef WPReusableBlockEditPanelProps
 *
 * @property {(newTitle:string)=>void} onChangeTitle  Callback to run when the
 *                                                    title input value is
 *                                                    changed.
 * @property {string}                  title          Title of the reusable
 *                                                    block.
 */

/**
 * Panel for enabling the editing and saving of a reusable block.
 *
 * @param {WPReusableBlockEditPanelProps} props Component props.
 *
 * @return {WPComponent} The panel.
 */
export default function ReusableBlockEditPanel( { onChange, title } ) {
	return (
		<TextControl
			className="reusable-block-edit-panel"
			label={ __( 'Name' ) }
			value={ title }
			onChange={ onChange }
		/>
	);
}
