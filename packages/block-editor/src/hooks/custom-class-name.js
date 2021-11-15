/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport, store as blocksStore } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { check, moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';
import {
	getActiveStyle,
	replaceActiveStyle,
} from '../components/block-styles/utils';
import { store as blockEditorStore } from '../store';

/**
 * Filters registered block settings, extending attributes with anchor using ID
 * of the first node.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	if ( hasBlockSupport( settings, 'customClassName', true ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			className: {
				type: 'string',
			},
		};
	}

	return settings;
}

/**
 * @typedef  {Object}   CustomClassNameMenuItemProps
 * @property {boolean}  isSelected                   Whether the item is selected.
 * @property {Function} onClick                      An onClick handler.
 * @property {Object}   style                        A block style object.
 */

/**
 * Returns a menu item component.
 *
 * @param {CustomClassNameMenuItemProps} props  The component props.
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
 * Override the default edit UI to include a new block inspector control for
 * assigning the custom class name, if block supports custom class name.
 *
 * @param {WPComponent} BlockEdit Original component.
 *
 * @return {WPComponent} Wrapped component.
 */
export const withInspectorControl = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			const hasCustomClassName = hasBlockSupport(
				props.name,
				'customClassName',
				true
			);

			const { updateBlockAttributes } = useDispatch( blockEditorStore );

			const blockStyles = useSelect(
				( select ) =>
					select( blocksStore ).getBlockStyles( props.name ),
				[ props.name, props.attributes.className ]
			);

			const hasBlockStyles = blockStyles && !! blockStyles.length;

			const activeStyle = hasBlockStyles
				? getActiveStyle(
						blockStyles,
						props.attributes.className || ''
				  )
				: null;

			const onSelectStyleClassName = ( style ) => {
				const styleClassName = replaceActiveStyle(
					props.attributes.className,
					activeStyle,
					style
				);
				updateBlockAttributes( props.clientId, {
					className: styleClassName,
				} );
			};

			const additionalClassNameContainerClasses = classnames(
				'additional-class-name-control__container',
				{
					'has-block-styles': hasBlockStyles,
				}
			);

			if ( hasCustomClassName && props.isSelected ) {
				return (
					<>
						<BlockEdit { ...props } />
						<InspectorControls __experimentalGroup="advanced">
							<div
								className={
									additionalClassNameContainerClasses
								}
							>
								<TextControl
									autoComplete="off"
									label={ __( 'Additional CSS class(es)' ) }
									value={ props.attributes.className || '' }
									onChange={ ( nextValue ) => {
										props.setAttributes( {
											className:
												nextValue !== ''
													? nextValue
													: undefined,
										} );
									} }
									help={ __(
										'Separate multiple classes with spaces.'
									) }
								/>
								{ hasBlockStyles && (
									<DropdownMenu
										className="additional-class-name-control__block-style-dropdown"
										icon={ moreVertical }
										label={ __( 'Existing Styles' ) }
									>
										{ ( { onClose } ) => (
											<MenuGroup
												label={ __(
													'Block style classes'
												) }
											>
												{ blockStyles.map(
													( style ) => {
														return (
															<CustomClassNameMenuItem
																style={ style }
																key={
																	style.label
																}
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
													}
												) }
											</MenuGroup>
										) }
									</DropdownMenu>
								) }
							</div>
						</InspectorControls>
					</>
				);
			}

			return <BlockEdit { ...props } />;
		};
	},
	'withInspectorControl'
);

/**
 * Override props assigned to save component to inject anchor ID, if block
 * supports anchor. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( extraProps, blockType, attributes ) {
	if (
		hasBlockSupport( blockType, 'customClassName', true ) &&
		attributes.className
	) {
		extraProps.className = classnames(
			extraProps.className,
			attributes.className
		);
	}

	return extraProps;
}

addFilter(
	'blocks.registerBlockType',
	'core/custom-class-name/attribute',
	addAttribute
);
addFilter(
	'editor.BlockEdit',
	'core/editor/custom-class-name/with-inspector-control',
	withInspectorControl
);
addFilter(
	'blocks.getSaveContent.extraProps',
	'core/custom-class-name/save-props',
	addSaveProps
);
