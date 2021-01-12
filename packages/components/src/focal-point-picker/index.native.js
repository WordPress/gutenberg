/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Image, RangeControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const MIN_POSITION_VALUE = 0;
const MAX_POSITION_VALUE = 100;

export default function FocalPointPicker( {
	focalPoint,
	minHeight,
	onChange,
	url,
} ) {
	const { x, y } = focalPoint;

	function setAxisPostion( axis ) {
		return ( pos ) => {
			onChange( {
				...focalPoint,
				[ axis ]: pos / 100,
			} );
		};
	}

	return (
		<View style={ styles.container }>
			{ /* TODO(David): Should I set `height` or `minHeight`? */ }
			<View style={ [ styles.media, { minHeight } ] }>
				<Image
					// TODO(David): Setting this creates a vertically evergrowing image. Why?
					// focalPoint={ focalPoint }
					url={ url }
				/>
			</View>
			<RangeControl
				value={ x * 100 }
				label={ __( 'X-Axis Position' ) }
				min={ MIN_POSITION_VALUE }
				max={ MAX_POSITION_VALUE }
				initialPosition={ x * 100 }
				allowReset
				onChange={ setAxisPostion( 'x' ) }
			/>
			<RangeControl
				value={ y * 100 }
				label={ __( 'Y-Axis Position' ) }
				min={ MIN_POSITION_VALUE }
				max={ MAX_POSITION_VALUE }
				initialPosition={ y * 100 }
				allowReset
				onChange={ setAxisPostion( 'y' ) }
			/>
		</View>
	);
}
