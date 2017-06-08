/**
 * External dependencies
 */
import ReactMarkdown from 'react-markdown';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import readme from '../README.md';

storiesOf( 'Components', module )
	.addDecorator( withKnobs )
	.add( 'Welcome', () => <ReactMarkdown source={ readme } /> );
