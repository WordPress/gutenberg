/**
 * External components
 */
import ReactMarkdown from 'react-markdown';
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import Button from '../';
import readme from '../README.md';

storiesOf( 'Components', module ).add( 'Button', () => <div>
	<Button>Test</Button>
	<ReactMarkdown source={ readme } />
</div> );
