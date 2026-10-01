// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { InnerBlocks } from '@wordpress/block-editor';

type NavigationLinkDeprecatedAttributes = {
	label?: string;
	type?: string;
	nofollow?: boolean;
	description?: string;
	id?: number;
	opensInNewTab?: boolean;
	url?: string;
};

const deprecated = [
	{
		isEligible( attributes: NavigationLinkDeprecatedAttributes ) {
			return attributes.nofollow;
		},

		attributes: {
			label: {
				type: 'string',
			},
			type: {
				type: 'string',
			},
			nofollow: {
				type: 'boolean',
			},
			description: {
				type: 'string',
			},
			id: {
				type: 'number',
			},
			opensInNewTab: {
				type: 'boolean',
				default: false,
			},
			url: {
				type: 'string',
			},
		},

		migrate( { nofollow, ...rest }: NavigationLinkDeprecatedAttributes ) {
			return {
				rel: nofollow ? 'nofollow' : '',
				...rest,
			};
		},

		save() {
			return <InnerBlocks.Content />;
		},
	},
];

export default deprecated;
