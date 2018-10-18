/**
 * External dependencies
 */
import { find, isNumber, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Dashicon from '../dashicon';
import BaseControl from '../base-control';
import Button from '../button';
import Dropdown from '../dropdown';
import RangeControl from '../range-control';
import { NavigableMenu } from '../navigable-container';

function FontSizePicker( {
	fallbackFontSize,
	fontSizes = [],
	disableCustomFontSizes = false,
	onChange,
	value,
	withSlider,
} ) {
	// Handle the old behavior where you passed a number into the FontSizePicker component
	if ( isNumber( value ) ) {
		deprecated( 'Using a number as the value for wp.components.FontSizePicker', {
			version: '4.3',
			alternative: 'a full font size object with name, slug, and size keys',
			plugin: 'Gutenberg',
			hint: 'You can use the wp.editor.withFontSizes HOC to manage the font size object.',
		} );

		// Try getting a font size object
		const fontSizeObject = find( fontSizes, { size: ( value === undefined ) ? fallbackFontSize : value } );

		// Prepare a custom font size object
		const customFontSizeObject = {
			slug: 'custom',
			size: value,
		};

		// Update value to the correct shape
		value = fontSizeObject || customFontSizeObject;
	}

	// Attempts to find a font size matching a value
	const isCustomFontSize = ( value.slug === 'custom' );

	// Handles changing a custom font size value.
	const onChangeCustomValue = ( event ) => {
		// Allow empty values
		onChange( ( event.target.value === '' ) ? '' : Number( event.target.value ) );
	};

	// Handles resetting to the default ("undefined") font size.
	const onResetFontSize = () => {
		onChange( undefined );
	};

	return (
		<BaseControl label={ __( 'Font Size' ) }>
			<div className="components-font-size-picker__buttons">
				<Dropdown
					className="components-font-size-picker__dropdown"
					contentClassName="components-font-size-picker__dropdown-content"
					position="bottom"
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							className="components-font-size-picker__selector"
							isLarge
							onClick={ onToggle }
							aria-expanded={ isOpen }
							aria-label={ __( 'Choose font size' ) }
						>
							{ ( value && value.name ) || ( isCustomFontSize && _x( 'Custom', 'font size name' ) ) }
						</Button>
					) }
					renderContent={ () => (
						<NavigableMenu>
							{ ( ! disableCustomFontSizes || isCustomFontSize ) &&
								<Button
									key={ 'custom' }
									onClick={ () => onChange( fallbackFontSize ) }
									className={ 'is-font-custom' }
									role="menuitem"
								>
									{ isCustomFontSize && <Dashicon icon="saved" /> }
									<span className="components-font-size-picker__dropdown-text-size">
										{ _x( 'Custom', 'font size name' ) }
									</span>
								</Button>
							}
							{ map( fontSizes, ( font ) => (
								<Button
									key={ font.slug }
									onClick={ () => onChange( font.slug ) }
									className={ 'is-font-' + font.slug }
									role="menuitem"
								>
									{ font.slug === value.slug && <Dashicon icon="saved" /> }
									<span className="components-font-size-picker__dropdown-text-size" style={ { fontSize: font.size } }>
										{ font.name }
									</span>
								</Button>
							) ) }
						</NavigableMenu>
					) }
				/>
				{ ( ! withSlider && isCustomFontSize ) &&
					<input
						className="components-range-control__number"
						type="number"
						onChange={ onChangeCustomValue }
						aria-label={ __( 'Custom font size' ) }
						value={ value.size || '' }
					/>
				}
				<Button
					className="components-font-size-picker__clear"
					type="button"
					onClick={ onResetFontSize }
					isSmall
					isDefault
					aria-label={ __( 'Reset font size' ) }
				>
					{ __( 'Reset' ) }
				</Button>
			</div>
			{ ( withSlider && isCustomFontSize ) &&
				<RangeControl
					className="components-font-size-picker__custom-input"
					label={ __( 'Custom Size' ) }
					value={ value.size || '' }
					initialPosition={ fallbackFontSize }
					onChange={ onChangeCustomValue }
					min={ 12 }
					max={ 100 }
					beforeIcon="editor-textcolor"
					afterIcon="editor-textcolor"
				/>
			}
		</BaseControl>
	);
}

export default withInstanceId( FontSizePicker );
