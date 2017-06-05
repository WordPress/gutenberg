/**
 * External components
 */
import ReactMarkdown from 'react-markdown';
import { storiesOf } from '@storybook/react';
import { text, boolean, withKnobs } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Button from '../';
import readme from '../README.md';

storiesOf( 'Components', module )
	.addDecorator( withKnobs )
	.add( 'Button', () => (
		<div>
			<ReactMarkdown source={ readme } />
			<h2>Test It</h2>
			<Button
				isPrimary={ boolean( 'isPrimary', false ) }
				isLarge={ boolean( 'isLarge', false ) }
				isToggled={ boolean( 'isToggled', false ) }
				disabled={ boolean( 'disabled', false ) }
			>
				{ text( 'Label', 'Default Label' ) }
			</Button>
		</div>
	) );
