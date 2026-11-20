/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Warning } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { RecursionProvider, useHasRecursion } from '../';

// Example recursive block component for the stories
const RecursiveBlock = ( { uniqueId, blockName, children, depth = 0 } ) => {
	const hasRecursion = useHasRecursion( uniqueId, blockName );

	if ( hasRecursion ) {
		return (
			<Warning>
				{ __( 'Block cannot be rendered inside itself.' ) }
			</Warning>
		);
	}

	return (
		<RecursionProvider uniqueId={ uniqueId } blockName={ blockName }>
			<div style={ { padding: 16, border: '1px solid #ccc', margin: 8 } }>
				<div>
					<strong>{ __( 'Block Info:' ) }</strong>
					<div>
						{ __( 'UniqueId:' ) } { uniqueId }
					</div>
					{ blockName && (
						<div>
							{ __( 'BlockName:' ) } { blockName }
						</div>
					) }
				</div>
				<div style={ { marginTop: 8 } }>
					{ children || __( 'Default Content' ) }
				</div>
				{ depth === 0 && (
					<RecursiveBlock
						uniqueId={ uniqueId }
						blockName={ blockName }
						depth={ depth + 1 }
					>
						{ __( 'Nested Content' ) }
					</RecursiveBlock>
				) }
			</div>
		</RecursionProvider>
	);
};

const meta = {
	title: 'BlockEditor/RecursionProvider',
	component: RecursionProvider,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: __(
					'A provider component that helps prevent infinite recursion in blocks by tracking rendered instances.'
				),
			},
		},
	},
	argTypes: {
		uniqueId: {
			control: { type: 'text' },
			description: __( 'Unique identifier for the block instance' ),
			table: {
				type: { summary: 'any' },
			},
		},
		blockName: {
			control: { type: 'text' },
			description: __( 'Optional block name' ),
			table: {
				type: { summary: 'string' },
				defaultValue: { summary: '' },
			},
		},
		children: {
			control: { type: 'text' },
			description: __( 'Child content to be rendered' ),
			table: {
				type: { summary: 'Element' },
			},
		},
	},
	args: {
		uniqueId: 'example-block-1',
		blockName: '',
		children: __( 'Sample Content' ),
	},
};

export default meta;

export const Default = {
	render: ( args ) => <RecursiveBlock { ...args } />,
};

export const WithCustomBlockName = {
	render: ( args ) => <RecursiveBlock { ...args } />,
	args: {
		uniqueId: 'example-block-2',
		blockName: 'core/custom-block',
		children: __( 'Custom Block Content' ),
	},
};

export const MultipleInstances = {
	render: ( args ) => (
		<div>
			<h3>{ __( 'Multiple Independent Instances' ) }</h3>
			<div style={ { display: 'flex', gap: '16px' } }>
				<RecursiveBlock { ...args } uniqueId="block-a" />
				<RecursiveBlock { ...args } uniqueId="block-b" />
			</div>
		</div>
	),
};

export const RecursionWarning = {
	render: ( args ) => (
		<RecursionProvider
			uniqueId={ args.uniqueId }
			blockName={ args.blockName }
		>
			<div style={ { padding: 16, border: '1px solid #ccc', margin: 8 } }>
				<p>{ __( 'Parent Block' ) }</p>
				<RecursiveBlock { ...args } />
			</div>
		</RecursionProvider>
	),
};
