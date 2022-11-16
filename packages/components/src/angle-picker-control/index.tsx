/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { FlexBlock, FlexItem } from '../flex';
import NumberControl from '../number-control';
import AngleCircle from './angle-circle';
import { Root } from './styles/angle-picker-control-styles';
import { space } from '../ui/utils/space';
import { Text } from '../text';
import { Spacer } from '../spacer';
import { COLORS } from '../utils/colors-values';

import type { WordPressComponentProps } from '../ui/context';
import type { AnglePickerControlProps } from './types';

function UnforwardedAnglePickerControl(
	props: WordPressComponentProps< AnglePickerControlProps, 'div' >,
	ref: ForwardedRef< any >
) {
	const {
		__nextHasNoMarginBottom = false,
		className,
		label = __( 'Angle' ),
		onChange,
		value,
		...restProps
	} = props;

	if ( ! __nextHasNoMarginBottom ) {
		deprecated(
			'Bottom margin styles for wp.components.AnglePickerControl',
			{
				since: '6.1',
				version: '6.4',
				hint: 'Set the `__nextHasNoMarginBottom` prop to true to start opting into the new styles, which will become the default in a future version.',
			}
		);
	}

	const handleOnNumberChange = ( unprocessedValue: string | undefined ) => {
		const inputValue =
			unprocessedValue !== undefined && unprocessedValue !== ''
				? parseInt( unprocessedValue, 10 )
				: 0;
		onChange?.( inputValue );
	};

	const classes = classnames( 'components-angle-picker-control', className );

	return (
		<Root
			{ ...restProps }
			ref={ ref }
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			className={ classes }
			gap={ 4 }
		>
			<FlexBlock>
				<NumberControl
					label={ label }
					className="components-angle-picker-control__input-field"
					max={ 360 }
					min={ 0 }
					onChange={ handleOnNumberChange }
					size="__unstable-large"
					step="1"
					value={ value }
					spinControls="none"
					suffix={
						<Spacer
							as={ Text }
							marginBottom={ 0 }
							marginRight={ space( 3 ) }
							style={ {
								color: COLORS.ui.theme,
							} }
						>
							°
						</Spacer>
					}
				/>
			</FlexBlock>
			<FlexItem
				style={ {
					marginBottom: space( 1 ),
					marginTop: 'auto',
				} }
			>
				<AngleCircle
					aria-hidden="true"
					value={ value }
					onChange={ onChange }
				/>
			</FlexItem>
		</Root>
	);
}

export const AnglePickerControl = forwardRef( UnforwardedAnglePickerControl );

export default AnglePickerControl;
