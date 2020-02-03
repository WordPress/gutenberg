/**
 * External dependencies
 */
import { boolean, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Placeholder from '../';
import TextControl from '../../text-control';

export default { title: 'Components/Placeholder', component: Placeholder };

export const _default = () => {
	const icon = text( 'Icon', 'smiley' );
	const instructions = text(
		'Instructions',
		'Here are instructions you should follow'
	);
	const label = text( 'Label', 'My Placeholder Label' );
	const isColumnLayout = boolean( 'isColumnLayout', false );

	return (
		<Placeholder
			icon={ icon }
			instructions={ instructions }
			label={ label }
			isColumnLayout={ isColumnLayout }
		>
			<div>
				<TextControl
					label="Sample Field"
					placeholder="Enter something here"
				/>
			</div>
		</Placeholder>
	);
};
