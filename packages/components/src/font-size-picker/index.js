/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';
import ButtonGroup from '../button-group';
import RangeControl from '../range-control';
import Tooltip from '../tooltip';

/**
 * If short and long font size names are available, render using the short name and add the tooltip using the long name.
 * If only short or long names but not their counterparts are provided, render them using only what is provided.
 *
 * @param {string}   label    Font size name, can be long, Small, or short, S.
 * @param {string}   value    Current font size.
 * @param {string}   size     Font size that this button sets.
 * @param {function} onChange Method that sets the font to the specified size.
 *
 * @return {Element} Element with name with tooltip.
 */
const fontSize = ( label, value, size, onChange ) => {
	return (
		<Button
			key={ size }
			isLarge
			isPrimary={ value === size }
			aria-pressed={ value === size }
			onClick={ () => onChange( size ) }
		>
			{ label }
		</Button>
	);
};

export default function FontSizePicker( { fontSizes = [], fallbackFontSize, value, onChange } ) {
	return (
		<Fragment>
			<div className="components-font-size-picker__buttons">
				<ButtonGroup aria-label={ __( 'Font Size' ) }>
					{
						map( fontSizes, ( { name, size, shortName } ) => shortName && name ? (
							<Tooltip text={ <div className="components-font-size-picker__name">{ name }</div> }>
								{ fontSize( shortName, value, size, onChange ) }
							</Tooltip>
						) : fontSize( shortName || name, value, size, onChange ) )
					}
				</ButtonGroup>
				<Button
					isLarge
					onClick={ () => onChange( undefined ) }
				>
					{ __( 'Reset' ) }
				</Button>
			</div>
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
		</Fragment>
	);
}
