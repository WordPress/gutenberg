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

const decorateWordPressUI = ( story ) => (
	<div className="wp-core-ui">
		{ story() }
	</div>
);

const defaultInfoConfig = {
	header: true,
	inline: true,
	propTables: false,
	styles: ( style ) => ( { ...style, header: { ...style.header, h1: { display: 'none' } } } ),
};

storiesOf( 'Components', module )
	.addDecorator( decorateWordPressUI )
	.addDecorator( withKnobs )
	.addWithInfo(
		'Button',
		( <ReactMarkdown source={ readme } /> ),
		() => (
			<Button
				isPrimary={ boolean( 'isPrimary', true ) }
				isLarge={ boolean( 'isLarge', false ) }
				isToggled={ boolean( 'isToggled', false ) }
				disabled={ boolean( 'disabled', false ) }
			>
				{ text( 'Label', 'Default Label' ) }
			</Button>
		),
		defaultInfoConfig
	);
