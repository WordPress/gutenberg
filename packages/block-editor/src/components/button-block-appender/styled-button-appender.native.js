/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';
import { Button } from '@wordpress/components';
import { Icon, plusCircleFilled } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

function StyledButtonAppender( {
	onClick,
	isOpen,
	disabled,
	style,
	getStylesFromColorScheme,
} ) {
	const appenderStyle = {
		...styles.appender,
		...getStylesFromColorScheme(
			styles.appenderLight,
			styles.appenderDark
		),
	};
	const addBlockButtonStyle = getStylesFromColorScheme(
		styles.addBlockButton,
		styles.addBlockButtonDark
	);

	return (
		<Button
			onClick={ onClick }
			aria-expanded={ isOpen }
			disabled={ disabled }
			fixedRatio={ false }
		>
			<View style={ [ appenderStyle, style ] }>
				<Icon
					icon={ plusCircleFilled }
					style={ addBlockButtonStyle }
					color={ addBlockButtonStyle.color }
					size={ addBlockButtonStyle.size }
				/>
			</View>
		</Button>
	);
}

export default withPreferredColorScheme( StyledButtonAppender );
