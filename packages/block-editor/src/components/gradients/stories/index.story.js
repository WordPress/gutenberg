/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	__experimentalGetGradientClass,
	getGradientValueBySlug,
	getGradientSlugByValue,
	__experimentalGetGradientObjectByGradientValue,
} from '../';
import { withGradient } from '../with-gradient';

// Mock block context for stories
const MockBlockEditContext = ( { children } ) => {
	return children;
};

// Example component that uses gradient utilities
const GradientUtilityDemo = () => {
	const gradients = [
		{
			name: 'Vivid cyan blue to vivid purple',
			gradient:
				'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
			slug: 'vivid-cyan-blue-to-vivid-purple',
		},
		{
			name: 'Light green cyan to vivid green cyan',
			gradient:
				'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
			slug: 'light-green-cyan-to-vivid-green-cyan',
		},
		{
			name: 'Luminous vivid amber to luminous vivid orange',
			gradient:
				'linear-gradient(135deg,rgba(252,185,0,1) 0%,rgba(255,105,0,1) 100%)',
			slug: 'luminous-vivid-amber-to-luminous-vivid-orange',
		},
		{
			name: 'Luminous vivid orange to vivid red',
			gradient:
				'linear-gradient(135deg,rgba(255,105,0,1) 0%,rgb(207,46,46) 100%)',
			slug: 'luminous-vivid-orange-to-vivid-red',
		},
	];

	const [ selectedSlug, setSelectedSlug ] = useState(
		'vivid-cyan-blue-to-vivid-purple'
	);

	const gradientClass = __experimentalGetGradientClass( selectedSlug );
	const gradientValue = getGradientValueBySlug( gradients, selectedSlug );

	return (
		<div style={ { padding: '20px' } }>
			<h3>Gradient Utilities Demo</h3>

			<div style={ { marginBottom: '20px' } }>
				<label htmlFor={ `gradient-select-${ selectedSlug }` }>
					Select a gradient:
				</label>
				<select
					id={ `gradient-select-${ selectedSlug }` }
					value={ selectedSlug }
					onChange={ ( e ) => setSelectedSlug( e.target.value ) }
					style={ { marginLeft: '10px', padding: '5px' } }
				>
					{ gradients.map( ( gradient ) => (
						<option key={ gradient.slug } value={ gradient.slug }>
							{ gradient.name }
						</option>
					) ) }
				</select>
			</div>

			<div style={ { marginBottom: '20px' } }>
				<strong>Gradient Class:</strong> { gradientClass || 'None' }
			</div>

			<div style={ { marginBottom: '20px' } }>
				<strong>Gradient Value:</strong>
				<pre style={ { fontSize: '12px', wordBreak: 'break-all' } }>
					{ gradientValue || 'None' }
				</pre>
			</div>

			<div
				style={ {
					width: '200px',
					height: '100px',
					background: gradientValue,
					border: '1px solid #ccc',
					borderRadius: '4px',
					marginBottom: '20px',
				} }
			/>

			<div>
				<h4>Utility Functions Test:</h4>
				<div>
					<strong>getGradientSlugByValue:</strong>{ ' ' }
					{ getGradientSlugByValue( gradients, gradientValue ) }
				</div>
				<div>
					<strong>getGradientObjectByGradientValue:</strong>{ ' ' }
					{ __experimentalGetGradientObjectByGradientValue(
						gradients,
						gradientValue
					)?.name || 'Not found' }
				</div>
			</div>
		</div>
	);
};

// Component that demonstrates withGradient HOC
const SimpleGradientBox = ( { gradientValue } ) => (
	<div
		style={ {
			width: '150px',
			height: '150px',
			background: gradientValue || '#f0f0f0',
			border: '1px solid #ccc',
			borderRadius: '8px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			color: 'white',
			fontWeight: 'bold',
			textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
		} }
	>
		Gradient Box
	</div>
);

const EnhancedGradientBox = withGradient( SimpleGradientBox );

// Component for gradient class generation story
const GradientClassGenerationComponent = () => {
	const [ slug, setSlug ] = useState( 'vivid-cyan-blue-to-vivid-purple' );
	const gradientClass = __experimentalGetGradientClass( slug );

	return (
		<div style={ { padding: '20px' } }>
			<h3>Gradient Class Generation</h3>
			<div style={ { marginBottom: '20px' } }>
				<label htmlFor={ `slug-input-${ slug }` }>Gradient Slug:</label>
				<input
					id={ `slug-input-${ slug }` }
					type="text"
					value={ slug }
					onChange={ ( e ) => setSlug( e.target.value ) }
					style={ {
						marginLeft: '10px',
						padding: '5px',
						fontFamily: 'monospace',
					} }
				/>
			</div>
			<div>
				<strong>Generated Class:</strong>
				<code
					style={ {
						padding: '4px 8px',
						backgroundColor: '#f5f5f5',
						borderRadius: '3px',
						marginLeft: '10px',
					} }
				>
					{ gradientClass || 'undefined' }
				</code>
			</div>
		</div>
	);
};

export default {
	title: 'BlockEditor/Gradients',
	component: GradientUtilityDemo,
	parameters: {
		docs: {
			description: {
				component: `
The Gradients module provides utilities for working with gradient values in block editor components.

## Features

- **withGradient**: Higher-order component that injects gradient values
- **__experimentalGetGradientClass**: Get CSS class name for a gradient slug
- **getGradientValueBySlug**: Get gradient CSS value from slug
- **getGradientSlugByValue**: Get gradient slug from CSS value
- **__experimentalGetGradientObjectByGradientValue**: Get full gradient object from value

## Usage

These utilities are designed to work within the block editor context and help manage gradient selections and applications.
				`,
			},
		},
	},
};

export const GradientUtilities = {
	render: () => <GradientUtilityDemo />,
};

export const WithGradientHOC = {
	render: () => (
		<MockBlockEditContext>
			<div style={ { padding: '20px' } }>
				<h3>withGradient Higher-Order Component</h3>
				<p>
					This demonstrates the withGradient HOC, which automatically
					injects gradient values from the block context.
				</p>
				<EnhancedGradientBox />
				<p style={ { fontSize: '12px', marginTop: '10px' } }>
					Note: In a real block editor context, this would show the
					current block&apos;s gradient value.
				</p>
			</div>
		</MockBlockEditContext>
	),
};

export const GradientClassGeneration = {
	render: () => <GradientClassGenerationComponent />,
};
