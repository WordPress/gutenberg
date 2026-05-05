/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Stack, Text, VisuallyHidden } from '@wordpress/ui';

// These are the lyrics to Hello Dolly
const DOLLY_LYRICS = [
	'Hello, Dolly',
	'Well, hello, Dolly',
	"It's so nice to have you back where you belong",
	"You're lookin' swell, Dolly",
	'I can tell, Dolly',
	"You're still glowin', you're still crowin'",
	"You're still goin' strong",
	"I feel the room swayin'",
	"While the band's playin'",
	'One of our old favorite songs from way back when',
	'So, take her wrap, fellas',
	'Dolly, never go away again',
	'Hello, Dolly',
	'Well, hello, Dolly',
	"It's so nice to have you back where you belong",
	"You're lookin' swell, Dolly",
	'I can tell, Dolly',
	"You're still glowin', you're still crowin'",
	"You're still goin' strong",
	"I feel the room swayin'",
	"While the band's playin'",
	'One of our old favorite songs from way back when',
	'So, golly, gee, fellas',
	'Have a little faith in me, fellas',
	'Dolly, never go away',
	"Promise, you'll never go away",
	"Dolly'll never go away again",
];

export default function HelloDolly() {
	// Randomly choose a line.
	const quote = useMemo( () => {
		return DOLLY_LYRICS[
			Math.floor( Math.random() * DOLLY_LYRICS.length )
		];
	}, [] );

	// Echoes and positions the chosen line of lyrics.
	return (
		<Card.Content>
			<Stack align="center" justify="center" style={ { minHeight: 200 } }>
				<Text
					variant="body-lg"
					render={ <p /> }
					style={ {
						textAlign: 'center',
						fontStyle: 'italic',
						fontFamily: 'Georgia, "Times New Roman", Times, serif',
					} }
				>
					<VisuallyHidden render={ <span /> }>
						{ __(
							'Quote from Hello Dolly song, by Jerry Herman:'
						) }{ ' ' }
					</VisuallyHidden>
					<span dir="ltr" lang="en">
						{ quote }
					</span>
				</Text>
			</Stack>
		</Card.Content>
	);
}
