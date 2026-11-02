import { Page } from '@wordpress/admin-ui';
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
			</Stack>
		</Page>
	);
}

export const stage = Stage;
