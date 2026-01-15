/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	TextareaControl,
	Notice,
	// @ts-expect-error: Not typed yet.
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ScreenHeader } from './screen-header';
import { useStyle } from './hooks';

function ScreenHeadCode() {
	// Get user-only styles (should not decode/encode to preserve raw head code)
	const [ style ] = useStyle( '', undefined, 'user', false );
	// Get all styles (inherited + user) for context and the setter
	const [ , setStyle ] = useStyle(
		'',
		undefined,
		'user',
		false
	);

	// Get the head code from the user style (not inherited)
	const customHeadCode = style?.headCode || '';

	function handleOnChange( newValue ) {
		setStyle( {
			...style,
			headCode: newValue,
		} );
	}

	return (
		<>
			<ScreenHeader
				title={ __( 'Custom Head Code' ) }
				description={
					__(
						'Add custom HTML, JavaScript, or meta tags that will be inserted in the <head> section of your site.'
					)
				}
			/>
			<div className="global-styles-ui-screen-head-code">
				<VStack spacing={ 3 }>
					<Notice
						status="warning"
						isDismissible={ false }
					>
						<strong>{ __( 'Warning:' ) }</strong>{ ' ' }
						{ __(
							'Custom head code is a powerful customization tool. Malicious or incorrect code can break your site or pose security risks. Always ensure you have a recent backup before saving changes.'
						) }
					</Notice>

					<TextareaControl
						label={ __( 'Custom Head Code' ) }
						value={ customHeadCode }
						onChange={ handleOnChange }
						rows={ 20 }
						className="global-styles-ui-screen-head-code__textarea"
						placeholder={ __(
							'<!-- Example: <meta name="description" content="My site description"> <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script> -->'
						) }
						spellCheck={ false }
					/>
				</VStack>
			</div>
		</>
	);
}

export default ScreenHeadCode;
