/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import TextHighlight from '../';

export default {
	title: 'Components/TextHighlight',
	component: TextHighlight,
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
	const textToMatch = text(
		'Text',
		'We call the new editor Gutenberg. The entire editing experience has been rebuilt for media rich pages and posts.'
	);

	const textToHighlight = text( 'Text to be highlighted ', 'Gutenberg' );

	return <TextHighlight text={ textToMatch } highlight={ textToHighlight } />;
};
