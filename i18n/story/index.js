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

storiesOf( 'Modules', module )
	.addDecorator( withKnobs )
	.add( 'i18n', () => <ReactMarkdown source={ readme } /> );
