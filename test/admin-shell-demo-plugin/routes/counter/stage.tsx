import { Page } from '@wordpress/admin-ui';
import { usePageVisibility } from '@wordpress/boot';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';
import { Link as RouteLink } from '@wordpress/route';
import { Stack, Text } from '@wordpress/ui';

const SHORTCUT = 'admin-shell-demo/add-one';

/**
 * Counts the seconds the page has been showing. It stops while another page
 * is showing, since a hidden page stays mounted but has no reason to work.
 */
function useSecondsShowing() {
	const isVisible = usePageVisibility();
	const [ seconds, setSeconds ] = useState( 0 );
	useEffect( () => {
		if ( ! isVisible ) {
			return;
		}
		const interval = setInterval(
			() => setSeconds( ( value ) => value + 1 ),
			1000
		);
		return () => clearInterval( interval );
	}, [ isVisible ] );
	return seconds;
}

function Stage() {
	const [ count, setCount ] = useState( 0 );
	const seconds = useSecondsShowing();

	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	useEffect( () => {
		registerShortcut( {
			name: SHORTCUT,
			category: 'global',
			description: __( 'Add one to the counter.' ),
			keyCombination: { modifier: 'access', character: 'u' },
		} );
	}, [ registerShortcut ] );
	// Only fires while this page is showing.
	useShortcut( SHORTCUT, () => setCount( ( value ) => value + 1 ) );

	return (
		<Page
			title={ __( 'Counter' ) }
			subTitle={ __(
				'Count up, then switch pages: the count stays where you left it, unless the page was unloaded to stay within the pages to keep alive.'
			) }
			hasPadding
		>
			<Stack direction="column" gap="lg" align="start">
				<Text>
					{ sprintf(
						/* translators: %d: number of clicks. */
						__( 'Count: %d' ),
						count
					) }
				</Text>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ () => setCount( count + 1 ) }
				>
					{ __( 'Add one' ) }
				</Button>
				<Text>
					{ __(
						'Or press Shift+Alt+U (Control+Option+U on a Mac). The shortcut only works while this page is showing.'
					) }
				</Text>
				<Text>
					{ sprintf(
						/* translators: %d: number of seconds. */
						__(
							'Seconds this page has been showing: %d. It pauses while another page is showing.'
						),
						seconds
					) }
				</Text>
				<RouteLink to="/history">
					{ __( 'Go to the History route of this page' ) }
				</RouteLink>
			</Stack>
		</Page>
	);
}

export const stage = Stage;
