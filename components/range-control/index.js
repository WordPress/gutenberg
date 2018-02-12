/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BaseControl, Button, Dashicon } from '../';
import withInstanceId from '../higher-order/with-instance-id';
import './style.scss';

function RangeControl( { label, value, instanceId, onChange, beforeIcon, afterIcon, help, allowReset, ...props } ) {
	const id = `inspector-range-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( Number( event.target.value ) );

	return (
		<BaseControl label={ label } id={ id } help={ help } className="blocks-range-control">
			{ beforeIcon && <Dashicon icon={ beforeIcon } size={ 20 } /> }
			<input
				className="blocks-range-control__slider"
				id={ id }
				type="range"
				value={ value }
				onChange={ onChangeValue }
				aria-describedby={ !! help ? id + '__help' : undefined }
				{ ...props } />
			{ afterIcon && <Dashicon icon={ afterIcon } /> }
			<input
				className="blocks-range-control__number"
				type="number"
				onChange={ onChangeValue }
				aria-label={ label }
				value={ value }
				{ ...props }
			/>
			{ allowReset &&
				<Button onClick={ () => onChange() } disabled={ value === undefined }>
					{ __( 'Reset' ) }
				</Button>
			}
		</BaseControl>
	);
}

export default withInstanceId( RangeControl );
