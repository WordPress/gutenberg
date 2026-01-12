/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { BlockEditorProvider } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { withColors } from '../index';

export default {
	title: 'BlockEditor/Colors',
	component: withColors,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Higher-Order Component (HOC) that injects color props.',
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
