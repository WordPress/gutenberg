/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';
import { Button, Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import styles from './styles.scss';

function ButtonBlockAppender( { rootClientId, getStylesFromColorScheme } ) {
	const appenderStyle = { ...styles.appender, ...getStylesFromColorScheme( styles.appenderLight, styles.appenderDark ) };
	const addBlockButtonStyle = getStylesFromColorScheme( styles.addBlockButton, styles.addBlockButtonDark );

	return (
		<>
			<Inserter
				rootClientId={ rootClientId }
				renderToggle={ ( { onToggle, disabled, isOpen } ) => (
					<Button
						isLarge
						isPrimary
						onClick={ onToggle }
						aria-expanded={ isOpen }
						disabled={ disabled }
						fixedRatio={ false }
					>
						<View style={ appenderStyle }>
							<Dashicon
								icon="plus-alt"
								style={ addBlockButtonStyle }
								color={ addBlockButtonStyle.color }
								size={ addBlockButtonStyle.size }
							/>
						</View>
					</Button>
				) }
				isAppender
			/>
		</>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/button-block-appender/README.md
 */
export default withPreferredColorScheme( ButtonBlockAppender );
