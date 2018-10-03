/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId } from '@wordpress/compose';

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
	instanceId,
	onChange,
	value,
	withSlider,
} ) {
	const onChangeValue = ( event ) => {
		const newValue = event.target.value;
		if ( newValue === '' ) {
			onChange( undefined );
			return;
		}
		onChange( Number( newValue ) );
	};

	const currentFont = fontSizes.find( ( font ) => font.size === value );
	const labelId = `components-font-size-picker-label-${ instanceId }`;

	return (
		<BaseControl
			label={ __( 'Font Size' ) }
			id={ labelId }
		>
			<div className="components-font-size-picker__buttons">
				<Dropdown
					className="components-font-size-picker__dropdown"
					contentClassName="components-font-size-picker__dropdown-content"
					position="bottom"
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button className="components-font-size-picker__selector" isLarge onClick={ onToggle } aria-expanded={ isOpen }>
							{ ( currentFont && currentFont.name ) || ( ! value && 'Normal' ) || 'Custom' }
						</Button>
					) }
					renderContent={ () => (
						<NavigableMenu aria-labelledby={ labelId }>
							{ map( fontSizes, ( { name, size, slug } ) => (
								<Button
									key={ slug }
									aria-pressed={ value === size }
									onClick={ () => onChange( slug === 'normal' ? undefined : size ) }
									className={ 'is-font-' + slug }
								>
									{ ( value === size || ( ! value && slug === 'normal' ) ) &&	<Dashicon icon="saved" /> }
									<span className="components-font-size-picker__dropdown-text-size" style={ { fontSize: size } }>
										{ name }
									</span>
								</Button>
							) ) }
						</NavigableMenu>
					) }
				/>
				{ ! withSlider &&
					<input
						className="components-range-control__number"
						type="number"
						onChange={ onChangeValue }
						aria-label={ __( 'Custom Size' ) }
						value={ value || '' }
					/>
				}
				<Button
					className="components-color-palette__clear"
					type="button"
					disabled={ value === undefined }
					onClick={ () => onChange( undefined ) }
					isButton
					isSmall
					isDefault
				>
					{ __( 'Reset' ) }
				</Button>
			</div>
			{ withSlider &&
				<RangeControl
					className="components-font-size-picker__custom-input"
					label={ __( 'Custom Size' ) }
					value={ value || '' }
					initialPosition={ fallbackFontSize }
					onChange={ onChange }
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
