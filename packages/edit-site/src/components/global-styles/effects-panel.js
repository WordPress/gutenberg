/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useStyle } from './hooks';

export default function EffectsPanel( { name } ) {
	const [ duration, setDuration ] = useStyle( 'effects.duration', name );

	return (
		<NumberControl
			label={ __( 'Duration (seconds)' ) }
			step={ 0.1 }
			value={ duration || '' }
			onChange={ setDuration }
			min={ 0.1 }
			__unstableInputWidth="120px"
			spinControls="custom"
			__nextHasNoMarginBottom
		/>
	);
}
