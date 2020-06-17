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
import { useSelect } from '@wordpress/data';

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
	const { padding } = useSelect( ( select ) =>
		select( 'core/block-editor' ).getSettings()
	);

	if ( ! hasBlockSupport( blockName, PADDING_SUPPORT_KEY ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const newStyle = {
			...style,
			spacing: {
				padding: next,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	const onChangeShowVisualizer = ( next ) => {
		const newStyle = {
			...style,
			visualizers: {
				padding: next,
			},
		};

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};

	return Platform.select( {
		web: (
			<>
				<BoxControl
					presetValues={ padding }
					values={ style?.spacing?.padding }
					onChange={ onChange }
					onChangeShowVisualizer={ onChangeShowVisualizer }
					label={ __( 'Padding' ) }
					units={ units }
				/>
			</>
		),
		native: null,
	} );
}

export const paddingStyleMappings = {
	paddingTop: [ 'spacing', 'padding', 'top' ],
	paddingRight: [ 'spacing', 'padding', 'right' ],
	paddingBottom: [ 'spacing', 'padding', 'bottom' ],
	paddingLeft: [ 'spacing', 'padding', 'left' ],
};
