/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { TextControl as WPTextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useLinkControlV2 } from '../hook';

/**
 * TitleInput subcomponent for LinkControlV2.
 *
 * Input for editing the link label/title text (the text displayed in the link).
 */
export const TitleInput = forwardRef< HTMLInputElement >(
	function TitleInput( props, ref ) {
		const { uncommittedValue, setUncommittedLabel } = useLinkControlV2();

		const handleChange = ( value: string ) => {
			setUncommittedLabel( value );
		};

		// Only show if there's a URL value
		const hasURL = !! uncommittedValue?.url;

		if ( ! hasURL ) {
			return null;
		}

		return (
			<WPTextControl
				ref={ ref }
				label={ __( 'Title' ) }
				value={ uncommittedValue?.label || '' }
				onChange={ handleChange }
				className="block-editor-link-control-v2__text-control"
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				{ ...props }
			/>
		);
	}
);

TitleInput.displayName = 'LinkControlV2.TitleInput';

