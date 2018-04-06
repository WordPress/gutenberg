/**
 * WordPress dependencies
 */
import classnames from 'classnames';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BaseControl, Button, Dashicon } from '../';
import withInstanceId from '../higher-order/with-instance-id';
import './style.scss';

function RangeControl( { className, label, value, instanceId, onChange, beforeIcon, afterIcon, help, allowReset, ...props } ) {
	const id = `inspector-range-control-${ instanceId }`;
	const onChangeValue = ( event ) => onChange( Number( event.target.value ) );

	return (
		<BaseControl
			label={ label }
			id={ id }
			help={ help }
			className={ classnames( 'components-range-control', className ) }
		>
			{ beforeIcon && <Dashicon icon={ beforeIcon } /> }
			<input
				className="components-range-control__slider"
				id={ id }
				type="range"
				value={ value }
				onChange={ onChangeValue }
				aria-describedby={ !! help ? id + '__help' : undefined }
				{ ...props } />
			{ afterIcon && <Dashicon icon={ afterIcon } /> }
			<input
				className="components-range-control__number"
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
