/**
 * External dependencies
 */
import { noop } from 'lodash';
import { contextConnect, useContextSystem } from '@wp-g2/context';
import {
	TextInput,
	SelectDropdown,
	FormGroup,
	Button,
} from '@wp-g2/components';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getSelectTemplateColumns } from './utils';
import { Grid } from '../grid';
import { View } from '../view';

function renderItem( { name, style } ) {
	return <span style={ style }>{ name }</span>;
}

function FontSizeControlSelect( props, forwardedRef ) {
	const {
		customLabel,
		disabled,
		inputValue,
		isDefaultValue,
		label,
		max,
		min,
		onChange = noop,
		onInputChange = noop,
		onReset = noop,
		options = [],
		size,
		value,
		withNumberInput,
		withSelect,
		...otherProps
	} = useContextSystem( props, 'FontSizeControlSelect' );

	const templateColumns = getSelectTemplateColumns( withNumberInput );
	const subControlsTemplateColumns = withNumberInput ? '1fr 1fr' : '1fr';

	return (
		<Grid alignment="bottom" templateColumns={ templateColumns }>
			{ withSelect && (
				<FormGroup label={ label }>
					<SelectDropdown
						disabled={ disabled }
						max={ 260 }
						onChange={ onChange }
						options={ options }
						renderItem={ renderItem }
						ref={ forwardedRef }
						size={ size }
						value={ value }
						{ ...otherProps }
					/>
				</FormGroup>
			) }
			<Grid
				alignment="bottom"
				templateColumns={ subControlsTemplateColumns }
			>
				{ withNumberInput && (
					<FormGroup label={ customLabel }>
						<TextInput
							disabled={ disabled }
							max={ max }
							min={ min }
							onChange={ onInputChange }
							size={ size }
							type="number"
							value={ inputValue }
						/>
					</FormGroup>
				) }
				<View>
					<Button
						disabled={ isDefaultValue }
						isBlock
						onClick={ onReset }
					>
						{ __( 'Reset' ) }
					</Button>
				</View>
			</Grid>
		</Grid>
	);
}

export default contextConnect( FontSizeControlSelect, 'FontSizeControlSelect' );
