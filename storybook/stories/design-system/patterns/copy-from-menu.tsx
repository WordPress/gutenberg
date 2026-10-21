import { useRef, useState } from '@wordpress/element';
import { copy } from '@wordpress/icons';
import { SnackbarList } from '@wordpress/components';
import { Menu, Stack } from '@wordpress/ui';
import styles from './copy-from-menu.module.css';

const SAMPLE_LINK = 'https://example.com/sample-page';
const LINK_COPIED_MESSAGE = 'Link copied to clipboard';
const LINK_COPY_FAILED_MESSAGE = "Couldn't copy link to clipboard.";

/**
 * Copies a link from a menu item.
 *
 * The menu closes on activation, so the confirmation is a `SnackbarList`
 * rather than a change to the item. The list animates the snackbar, and
 * `Snackbar` announces the message politely. The example does not add a
 * second live region.
 */
export function CopyFromMenuExample() {
	const [ notices, setNotices ] = useState<
		Array< { id: string; content: string } >
	>( [] );
	const requestRef = useRef( 0 );

	function showSnackbar( message: string ) {
		setNotices( [
			{ id: String( requestRef.current ), content: message },
		] );
	}

	function onRemove( id: string ) {
		setNotices( ( current ) =>
			current.filter( ( notice ) => notice.id !== id )
		);
	}

	function onCopy() {
		const requestId = ++requestRef.current;

		let pending: Promise< void >;
		try {
			pending = navigator.clipboard.writeText( SAMPLE_LINK );
		} catch {
			showSnackbar( LINK_COPY_FAILED_MESSAGE );
			return;
		}

		void pending.then(
			() => {
				if ( requestId !== requestRef.current ) {
					return;
				}
				showSnackbar( LINK_COPIED_MESSAGE );
			},
			() => {
				if ( requestId !== requestRef.current ) {
					return;
				}
				showSnackbar( LINK_COPY_FAILED_MESSAGE );
			}
		);
	}

	return (
		<Stack
			align="center"
			justify="center"
			style={ {
				position: 'relative',
				minHeight: '20rem',
			} }
		>
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item
						onClick={ onCopy }
						prefix={ <Menu.PrefixIcon icon={ copy } /> }
					>
						<Menu.ItemLabel>Copy link</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
			<SnackbarList
				className={ styles.snackbars }
				notices={ notices }
				onRemove={ onRemove }
			/>
		</Stack>
	);
}
