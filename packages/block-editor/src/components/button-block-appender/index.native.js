/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Button, Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import styles from './styles.scss';

function ButtonBlockAppender( { rootClientId } ) {
	return (
		<>
			<Inserter
				rootClientId={ rootClientId }
				renderToggle={ ( { onToggle, disabled, isOpen } ) => (
					<Button
						onClick={ onToggle }
						aria-expanded={ isOpen }
						disabled={ disabled }
						fixedRatio={ false }
					>
						<View style={ [ styles.appender, { flex: 1 } ] }>
							<Dashicon
								icon="plus-alt"
								style={ styles.addBlockButton }
								color={ styles.addBlockButton.color }
								size={ styles.addBlockButton.size }
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
export default ButtonBlockAppender;
