/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';
/**
 * Internal dependencies
 */
import ExternalLink from '../';

export default {
	title: 'Components/ExternalLink',
	component: ExternalLink,
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
	const title = text( 'children', 'WordPress' );
	const href = text( 'href', 'https://wordpress.org' );

	return <ExternalLink href={ href }>{ title }</ExternalLink>;
};
