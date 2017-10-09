/**
 * External dependencies
 */
import classnames from 'classnames';
import { ChromePicker } from 'react-color';

/**
 * WordPress dependencies
 */
import { Dropdown } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import withEditorSettings from '../with-editor-settings';

function ColorPalette( { colors, value, onChange } ) {
	return (
		<div className="blocks-color-palette">
			{ colors.map( ( color ) => {
				const style = { color: color };
				const className = classnames( 'blocks-color-palette__item', { 'is-active': value === color } );

				return (
					<div key={ color } className="blocks-color-palette__item-wrapper">
						<button
							type="button"
							className={ className }
							style={ style }
							onClick={ () => onChange( value === color ? undefined : color ) }
							aria-label={ sprintf( __( 'Color: %s' ), color ) }
							aria-pressed={ value === color }
						/>
					</div>
				);
			} ) }

			<Dropdown
				className="blocks-color-palette__item-wrapper blocks-color-palette__custom-color"
				contentClassName="blocks-color-palette__picker "
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button
						type="button"
						aria-expanded={ isOpen }
						className="blocks-color-palette__item"
						onClick={ onToggle }
						aria-label={ __( 'Custom color picker' ) }
					>
						<span className="blocks-color-palette__custom-color-gradient" />
					</button>
				) }
				renderContent={ () => (
					<ChromePicker
						color={ value }
						onChangeComplete={ ( color ) => onChange( color.hex ) }
						style={ { width: '100%' } }
						disableAlpha
					/>
				) }
			/>

			<div className="blocks-color-palette__item-wrapper blocks-color-palette__clear-color">
				<button
					className="blocks-color-palette__item"
					onClick={ () => onChange( undefined ) }
					aria-label={ __( 'Remove color' ) }
				>
					<span className="blocks-color-palette__clear-color-line" />
				</button>
			</div>
		</div>
	);
}

export default withEditorSettings(
	( settings ) => ( {
		colors: settings.colors,
	} )
)( ColorPalette );
