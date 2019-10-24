/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { IconButton, Dropdown, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';
import { ColorPaletteControl, ContrastChecker } from '@wordpress/block-editor';

/**
 * Color Selector Icon component.
 *
 * @return {*} React Icon component.
 */
const ColorSelectorIcon = ( { style } ) =>
	<div className="block-library-colors-selector__icon-container">
		<div
			className="block-library-colors-selector__state-selection wp-block-navigation-menu-item"
			style={ style }
		>
			Aa
		</div>
	</div>;

/**
 * Renders the Colors Selector Toolbar with the icon button.
 *
 * @param {Object}   style           - Colors style object.
 * @return {*} React toggle button component.
 */
const renderToggleComponent = ( style ) => ( { onToggle, isOpen } ) => {
	const openOnArrowDown = ( event ) => {
		if ( ! isOpen && event.keyCode === DOWN ) {
			event.preventDefault();
			event.stopPropagation();
			onToggle();
		}
	};

	return (
		<ToolbarGroup>
			<IconButton
				className="components-icon-button components-toolbar__control block-library-colors-selector__toggle"
				label={ __( 'Open Colors Selector' ) }
				onClick={ onToggle }
				onKeyDown={ openOnArrowDown }
				icon={ <ColorSelectorIcon style={ style } /> }
			/>
		</ToolbarGroup>
	);
};

const renderContent = ( { backgroundColor, textColor, onColorChange = noop } ) => ( () => {
	const setColor = ( attr ) => ( value ) => onColorChange( { attr, value } );

	return (
		<>
			<div className="color-palette-controller-container">
				<ColorPaletteControl
					value={ backgroundColor.color }
					onChange={ setColor( 'backgroundColor' ) }
					label={ __( 'Background Color' ) }
				/>
			</div>

			<div className="color-palette-controller-container">
				<ColorPaletteControl
					value={ textColor.color }
					onChange={ setColor( 'textColor' ) }
					label={ __( 'Text Color' ) }
				/>
			</div>

			<ContrastChecker
				textColor={ textColor.color }
				backgroundColor={ backgroundColor.color }
				isLargeText={ false }
			/>
		</>
	);
} );

export default ( { style, className, ...colorControlProps } ) =>
	<Dropdown
		position="bottom right"
		className={ classnames( 'block-library-colors-selector', className ) }
		contentClassName="block-library-colors-selector__popover"
		renderToggle={ renderToggleComponent( style ) }
		renderContent={ renderContent( colorControlProps ) }
	/>;
