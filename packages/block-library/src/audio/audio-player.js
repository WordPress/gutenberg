/**
 * WordPress dependencies
 */
import { Disabled } from '@wordpress/components';

export function AudioPlayer( { src } ) {
	/*
		Disable the audio tag so the user clicking on it won't play the
		file or change the position slider when the controls are enabled.
	*/
	return (
		<Disabled>
			<audio controls="controls" src={ src } />
		</Disabled>
	);
}
