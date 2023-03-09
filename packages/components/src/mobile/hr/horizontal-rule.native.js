/**
 * WordPress dependencies
 */
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import HR from './index';
import styles from './style.scss';

const HorizontalRule = ( { lineStyle, color } ) => {
	const lineStyles = [
		usePreferredColorSchemeStyle(
			styles[ 'horizontal-rule__line' ],
			styles[ 'horizontal-rule__line--dark' ]
		),
		lineStyle,
	];

	return (
		<HR
			color={ color }
			lineStyle={ lineStyles }
			marginLeft={ 0 }
			marginRight={ 0 }
		/>
	);
};

export { HorizontalRule };
