/**
 * External components
 */
import ReactMarkdown from 'react-markdown';
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import readme from '../README.md';

storiesOf( 'Components', module )
	.add( 'Welcome', () => <ReactMarkdown source={ readme } /> );
