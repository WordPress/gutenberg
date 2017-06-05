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
	<ReactMarkdown source={ readme } />
	<h2>Examples</h2>
	<Button>Default Button</Button>
	<Button isPrimary>Primary Button</Button>
</div> );
