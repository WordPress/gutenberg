/**
 * External dependencies
 */
import { isFunction } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import ColorPicker from '../color-picker';

const ColorControl = ( props ) => {
	const { label, color, help, instanceId, className, onChange, disableAlpha } = props;
	const id = `color-toggle-control-${ instanceId }`;

	let describedBy, helpLabel;
	if ( help ) {
		describedBy = id + '__help';
		helpLabel = isFunction( help ) ? help( color ) : help;
	}
	return (
		<BaseControl
			id={ id }
			label={ label }
			help={ helpLabel }
			className={ classnames( 'component-color-control', className ) }
		>
			<ColorPicker
				color={ color }
				onChangeComplete={ ( val ) => {
					onChange( val );
				} }
				disableAlpha={ disableAlpha }
				aria-describedby={ describedBy }
			/>
		</BaseControl>
	);
};

export default withInstanceId( ColorControl );
