/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { check, moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../';
import { getActiveStyle, replaceActiveStyle } from '../block-styles/utils';
import { store as blockEditorStore } from '../../store';

/**
 * @typedef  {Object}   CustomClassNameMenuDropDownMenuProps
 * @property {string}   activeStyle            The currently active style.
 * @property {Object}   blockStyles            A collection of Block Styles.
 * @property {Function} onSelectStyleClassName An onClick handler.
 */

/**
 * Returns a DropDownMenu component.
 *
 * @param {CustomClassNameMenuDropDownMenuProps} props The component.
 * @return {WPComponent}                        The menu item component.
 */
function CustomClassNameMenuDropDownMenu( {
	activeStyle,
	blockStyles,
	onSelectStyleClassName,
} ) {
	return (
		<DropdownMenu
			className="additional-class-name-control__block-style-dropdown"
			icon={ moreVertical }
			label={ __( 'Existing Styles' ) }
		>
			{ ( { onClose } ) => (
				<MenuGroup label={ __( 'Block style classes' ) }>
					{ blockStyles.map( ( style ) => {
						const isSelected = activeStyle?.name === style.name;
						const icon = isSelected ? check : null;
						return (
							<MenuItem
								key={ style?.label }
								icon={ icon }
								isSelected={ isSelected }
								onClick={ () => {
									onSelectStyleClassName( style );
									onClose();
								} }
								role="menuitemcheckbox"
							>
								{ style?.label }
							</MenuItem>
						);
					} ) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}

/**
 * @typedef  {Object}   CustomClassNameControlProps
 * @property {string}   clientId      Selected Block clientId.
 * @property {string}   name          Selected Block name.
 * @property {Object}   attributes    Selected Block's attributes.
 * @property {Function} setAttributes Set attributes callback.
 */

/**
 * Control to display custom class name control dropdown and text input.
 *
 * @param {CustomClassNameControlProps} props Component props.
 *
 * @return {WPElement} Font appearance control.
 */
export default function CustomClassNameControl( {
	clientId,
	name,
	attributes,
	setAttributes,
} ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const blockStyles = useSelect(
		( select ) => select( blocksStore ).getBlockStyles( name ),
		[ name, attributes.className ]
	);

	const hasBlockStyles = blockStyles && !! blockStyles.length;

	const activeStyle = hasBlockStyles
		? getActiveStyle( blockStyles, attributes.className || '' )
		: null;

	const onSelectStyleClassName = ( style ) => {
		const styleClassName = replaceActiveStyle(
			attributes.className,
			activeStyle,
			style
		);
		updateBlockAttributes( clientId, {
			className: styleClassName,
		} );
	};

	const additionalClassNameContainerClasses = classnames(
		'additional-class-name-control__container',
		{
			'has-block-styles': hasBlockStyles,
		}
	);

	return (
		<InspectorControls __experimentalGroup="advanced">
			<div className={ additionalClassNameContainerClasses }>
				<TextControl
					className="additional-class-name-control__text-control"
					autoComplete="off"
					label={ __( 'Additional CSS class(es)' ) }
					value={ attributes.className || '' }
					onChange={ ( nextValue ) => {
						setAttributes( {
							className: nextValue !== '' ? nextValue : undefined,
						} );
					} }
					help={ __( 'Separate multiple classes with spaces.' ) }
				>
					{ hasBlockStyles && (
						<CustomClassNameMenuDropDownMenu
							activeStyle={ activeStyle }
							blockStyles={ blockStyles }
							onSelectStyleClassName={ onSelectStyleClassName }
						/>
					) }
				</TextControl>
			</div>
		</InspectorControls>
	);
}
