/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import TextHighlight from '../';

export default { title: 'Components|TextHighlight', component: TextHighlight };

export const _default = () => {
	const defaultText = 'We call the new editor Gutenberg. The entire editing experience has been rebuilt for media rich pages and posts.';
	const textToMatch = text( 'Text', defaultText );

	const textToHighlight = text( 'Text to be highlighted ', 'Gutenberg' );

	return (
		<TextHighlight text={ textToMatch } highlight={ textToHighlight } />
	);
};
