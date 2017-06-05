/**
 * External dependencies
 */
import ReactMarkdown from 'react-markdown';
import { storiesOf } from '@storybook/react';
import { text, boolean, withKnobs } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Button from '../';
import readme from '../README.md';

storiesOf( 'Components', module ).addDecorator( withKnobs ).addWithInfo(
	'Button',
	<ReactMarkdown source={ readme } />,
	() => (
		<Button
			isPrimary={ boolean( 'isPrimary', false ) }
			isLarge={ boolean( 'isLarge', false ) }
			isToggled={ boolean( 'isToggled', false ) }
			disabled={ boolean( 'disabled', false ) }
		>
			{ text( 'Label', 'Default Label' ) }
		</Button>
	),
	{
		header: true,
		inline: true,
		propTables: false,
		styles: ( style ) => ( { ...style, header: { ...style.header, h1: { display: 'none' } } } ),
	}
);
