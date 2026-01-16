/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { BlockEditorProvider } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { withColors, createCustomColorsHOC } from '../index';

export default {
	title: 'BlockEditor/Colors',
	component: withColors,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Higher-Order Component (HOC) that injects color props. \n\n **Default Usage:** The component above demonstrates the standard usage, where it retrieves its color palette (Red and Blue) dynamically from the global Block Editor settings.',
			},
		},
	},
};

/**
 * A simple component to demonstrate withColors HOC.
 */
function SimpleBox( { backgroundColor, setBackgroundColor } ) {
	return (
		<div
			style={ {
				backgroundColor: backgroundColor?.color,
				padding: '20px',
				border: '1px solid #ccc',
				textAlign: 'center',
			} }
		>
			<p>
				<strong>Current Slug: </strong>
				{ backgroundColor?.slug || 'none' }
			</p>
			<button onClick={ () => setBackgroundColor( 'red' ) }>
				Set Red
			</button>
			<button onClick={ () => setBackgroundColor( 'blue' ) }>
				Set Blue
			</button>
			<button onClick={ () => setBackgroundColor( undefined ) }>
				Clear
			</button>
		</div>
	);
}

const WrappedBox = withColors( 'backgroundColor' )( SimpleBox );

export const Default = {
	render: function Template() {
		const [ attributes, setAttributes ] = useState( {} );

		return (
			<BlockEditorProvider
				settings={ {
					colors: [
						{ name: 'Red', slug: 'red', color: 'red' },
						{ name: 'Blue', slug: 'blue', color: 'blue' },
					],
				} }
			>
				<WrappedBox
					attributes={ attributes }
					setAttributes={ ( newAttrs ) =>
						setAttributes( ( prev ) => ( {
							...prev,
							...newAttrs,
						} ) )
					}
				/>
			</BlockEditorProvider>
		);
	},
};

/**
 * A custom component to demonstrate createCustomColorsHOC.
 */
function CustomBox( { backgroundColor, setBackgroundColor } ) {
	return (
		<div
			style={ {
				backgroundColor: backgroundColor?.color,
				padding: '20px',
				border: '1px solid #ccc',
				textAlign: 'center',
			} }
		>
			<p>
				<strong>Current Slug: </strong>
				{ backgroundColor?.slug || 'none' }
			</p>
			<button onClick={ () => setBackgroundColor( 'cyan' ) }>
				Set Cyan
			</button>
			<button onClick={ () => setBackgroundColor( 'magenta' ) }>
				Set Magenta
			</button>
			<button onClick={ () => setBackgroundColor( undefined ) }>
				Clear
			</button>
		</div>
	);
}

const CUSTOM_PALETTE = [
	{ name: 'Cyan', slug: 'cyan', color: '#00ffff' },
	{ name: 'Magenta', slug: 'magenta', color: '#ff00ff' },
];

const WrappedCustomBox =
	createCustomColorsHOC( CUSTOM_PALETTE )( 'backgroundColor' )( CustomBox );

export const CustomPalette = {
	parameters: {
		docs: {
			description: {
				story: 'This shows `createCustomColorsHOC`. It uses a hardcoded, static palette (Cyan and Magenta) that is isolated from the global theme settings.',
			},
		},
	},
	render: function Template() {
		const [ attributes, setAttributes ] = useState( {} );

		return (
			<div>
				<WrappedCustomBox
					attributes={ attributes }
					setAttributes={ ( newAttrs ) =>
						setAttributes( ( prev ) => ( {
							...prev,
							...newAttrs,
						} ) )
					}
				/>
			</div>
		);
	},
};
