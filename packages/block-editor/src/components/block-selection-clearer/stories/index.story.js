/**
 * Internal dependencies
 */
import BlockSelectionClearer from "..";

/**
 * WordPress dependencies
 */
import { __ } from "@wordpress/i18n";

const meta = {
    title: 'Components/BlockSelectionClearer',
    component: BlockSelectionClearer,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: 'A component that clears block selection when clicked.',
			},
		},
	},
	argTypes: {
        props:{
            control: { type: null },
            description: 'The props for the component.',
            table: {
                type: {
                    summary: 'Object',
                },
            },
        }
	},
};

export default meta;

export const Default = {
	render: function Template( args ) {
		return (
            <BlockSelectionClearer { ...args }>
                <button>
                   { __('Block Selection Clearer') }
                </button>
            </BlockSelectionClearer>
        )
	},
};