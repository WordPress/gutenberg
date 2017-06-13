/**
 * External dependencies
 */
import ReactMarkdown from 'react-markdown';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import readme from '../../docs/coding-guidelines.md';

storiesOf( 'Gutenberg', module )
	.addDecorator( withKnobs )
	.add( 'Coding Guidelines', () => <ReactMarkdown source={ readme } /> );
