import { Page } from '@wordpress/admin-ui';
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link as RouteLink } from '@wordpress/route';
import { Stack, Text } from '@wordpress/ui';

function Stage() {
	const [ count, setCount ] = useState( 0 );

	return (
		<Page
			title={ __( 'Counter' ) }
			subTitle={ __(
				'Count up, then switch pages: the count stays where you left it.'
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
				<RouteLink to="/history">
					{ __( 'Go to the History route of this page' ) }
				</RouteLink>
			</Stack>
		</Page>
	);
}

export const stage = Stage;
