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
import Inserter from '../inserter';
import styles from './styles.scss';

function ButtonBlockAppender( {
	rootClientId,
	getStylesFromColorScheme,
	showSeparator,
	onAddBlock,
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
		<>
			<Inserter
				rootClientId={ rootClientId }
				renderToggle={ ( { onToggle, disabled, isOpen } ) => (
					<Button
						onClick={ onAddBlock || onToggle }
						aria-expanded={ isOpen }
						disabled={ disabled }
						fixedRatio={ false }
					>
						<View style={ appenderStyle }>
							<Icon
								icon={ plusCircleFilled }
								style={ addBlockButtonStyle }
								color={ addBlockButtonStyle.color }
								size={ addBlockButtonStyle.size }
							/>
						</View>
					</Button>
				) }
				isAppender
				showSeparator={ showSeparator }
			/>
		</>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/button-block-appender/README.md
 */
export default withPreferredColorScheme( ButtonBlockAppender );
