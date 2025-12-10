/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import URLInput from '../index';

/**
 * Manual test component for URLInput validation
 *
 * To use this:
 * 1. Import this component in your test file or storybook
 * 2. Render it to see the validation in action
 */
export default function URLInputValidationTest() {
	const [ url, setUrl ] = useState( '' );
	const [ customValidity, setCustomValidity ] = useState( undefined );

	return (
		<div style={ { padding: '20px', maxWidth: '600px' } }>
			<h2>URLInput Validation Test</h2>
			<p>
				Try typing &quot;error&quot; in the field below to see
				validation in action.
			</p>
			<URLInput
				label={ __( 'URL' ) }
				value={ url }
				onChange={ ( newUrl ) => {
					setUrl( newUrl );
					// Set validation based on value
					if ( newUrl?.toLowerCase() === 'error' ) {
						setCustomValidity( {
							type: 'invalid',
							message: 'The word "error" is not allowed.',
						} );
					} else if ( newUrl && ! newUrl.startsWith( 'http' ) ) {
						setCustomValidity( {
							type: 'invalid',
							message: 'URL must start with http:// or https://',
						} );
					} else {
						setCustomValidity( undefined );
					}
				} }
				customValidity={ customValidity }
				help={ __(
					'Enter a URL. Type "error" to see validation, or enter a URL without http:// to see another validation.'
				) }
			/>
			<div style={ { marginTop: '20px' } }>
				<p>
					<strong>Current value:</strong> { url || '(empty)' }
				</p>
				<p>
					<strong>Validation state:</strong>{ ' ' }
					{ customValidity
						? `${ customValidity.type }: ${ customValidity.message }`
						: 'valid' }
				</p>
			</div>
		</div>
	);
}
