/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';
import { hasBlockSupport } from '@wordpress/blocks';
import { __experimentalBoxControl as BoxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';
import { useCustomUnits } from '../components/unit-control';

export const PADDING_SUPPORT_KEY = '__experimentalPadding';

/**
 * Inspector control panel containing the line height related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Line height edit element.
 */
export function PaddingEdit( props ) {
	const {
		name: blockName,
		attributes: { style },
		setAttributes,
	} = props;

	const units = useCustomUnits();

	if ( ! hasBlockSupport( blockName, PADDING_SUPPORT_KEY ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const newStyle = {
			...style,
			padding: next,
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	return Platform.select( {
		web: (
			<>
				<BoxControl
					values={ style?.padding }
					onChange={ onChange }
					label={ __( 'Padding' ) }
					units={ units }
				/>
			</>
		),
		native: null,
	} );
}

export const paddingStyleMappings = {
	paddingTop: [ 'padding', 'top' ],
	paddingRight: [ 'padding', 'right' ],
	paddingBottom: [ 'padding', 'bottom' ],
	paddingLeft: [ 'padding', 'left' ],
};
