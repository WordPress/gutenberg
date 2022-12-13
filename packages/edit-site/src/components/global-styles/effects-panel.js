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
	const [ time, setTime ] = useStyle( 'effects.time', name );

	return (
		<NumberControl
			label={ __( 'Duration (seconds)' ) }
			step={ 0.1 }
			value={ time || '' }
			onChange={ ( value ) => setTime( value ) }
			min={ 0.1 }
		/>
	);
}
