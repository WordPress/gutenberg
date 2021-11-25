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
 * @typedef  {Object}   CustomClassNameMenuItemProps
 * @property {boolean}  isSelected Whether the item is selected.
 * @property {Function} onClick    An onClick handler.
 * @property {Object}   style      A block style object.
 */

/**
 * Returns a menu item component.
 *
 * @param {CustomClassNameMenuItemProps} props The component.
 * @return {WPComponent}                        The menu item component.
 */
function CustomClassNameMenuItem( { isSelected, onClick, style } ) {
	return (
		<MenuItem
			key={ style?.label }
			icon={ isSelected && check }
			isSelected={ isSelected }
			onClick={ onClick }
			role="menuitemcheckbox"
		>
			{ style?.label }
		</MenuItem>
	);
}

/**
 * @typedef  {Object}   CustomClassNameControlProps
 * @property {string}   clientId                    Selected Block clientId.
 * @property {string}   name                        Selected Block name.
 * @property {Object}   attributes                  Selected Block's attributes.
 * @property {Function} setAttributes               Set attributes callback.
 */

/**
 * Control to display unified font style and weight options.
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
						<DropdownMenu
							className="additional-class-name-control__block-style-dropdown"
							icon={ moreVertical }
							label={ __( 'Existing Styles' ) }
						>
							{ ( { onClose } ) => (
								<MenuGroup
									label={ __( 'Block style classes' ) }
								>
									{ blockStyles.map( ( style ) => {
										return (
											<CustomClassNameMenuItem
												style={ style }
												key={ style.label }
												isSelected={
													activeStyle?.name ===
													style.name
												}
												onClick={ () => {
													onSelectStyleClassName(
														style
													);
													onClose();
												} }
											/>
										);
									} ) }
								</MenuGroup>
							) }
						</DropdownMenu>
					) }
				</TextControl>
			</div>
		</InspectorControls>
	);
}
