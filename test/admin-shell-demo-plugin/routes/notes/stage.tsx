import { Page } from '@wordpress/admin-ui';
import { Dropdown as WCDropdown } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text, TextareaControl } from '@wordpress/ui';

function Stage() {
	const [ note, setNote ] = useState( '' );
	const [ openedAt ] = useState( () => new Date().toLocaleTimeString() );

	return (
		<Page
			title={ __( 'Notes' ) }
			subTitle={ __(
				'A page from the Admin Shell Demo plugin. Type a note, switch to another page and come back: it is still here.'
			) }
			hasPadding
		>
			<Stack direction="column" gap="lg">
				<Text>
					{ sprintf(
						/* translators: %s: time of day. */
						__( 'This page started at %s.' ),
						openedAt
					) }
				</Text>
				<TextareaControl
					label={ __( 'Note' ) }
					value={ note }
					onChange={ ( event ) => setNote( event.target.value ) }
				/>
				<Link href="admin.php?page=shell-counter&p=%2Fhistory">
					{ __( 'Open the Counter page on its History route' ) }
				</Link>
				<Link href="themes.php?page=font-library-wp-admin">
					{ __( 'Open Appearance › Fonts' ) }
				</Link>
				<WCDropdown
					renderToggle={ ( { isOpen, onToggle } ) => (
						<button
							type="button"
							aria-expanded={ isOpen }
							onClick={ onToggle }
						>
							{ __( 'Open a popover' ) }
						</button>
					) }
					renderContent={ () => (
						<Text>
							{ __(
								'A popover from @wordpress/components. Switch pages while it is open: it hides with this page.'
							) }
						</Text>
					) }
				/>
			</Stack>
		</Page>
	);
}

export const stage = Stage;
