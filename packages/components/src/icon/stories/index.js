/**
 * External dependencies
 */
import { number } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';
import { wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Icon from '../';
import { VStack } from '../../v-stack';

export default {
	title: 'Components/Icon',
	component: Icon,
	parameters: {
		knobs: { disable: false },
	},
};

const IconSizeLabel = ( { size } ) => (
	<div style={ { fontSize: 12 } }>{ size }px</div>
);

export const _default = () => {
	const size = number( 'Size', '24' );

	return (
		<div>
			<Icon icon={ wordpress } size={ size } />
			<IconSizeLabel size={ size } />
		</div>
	);
};

export const sizes = () => {
	const iconSizes = [ 14, 16, 20, 24, 28, 32, 40, 48, 56 ];

	return (
		<>
			{ iconSizes.map( ( size ) => (
				<div
					key={ size }
					style={ { padding: 20, display: 'inline-block' } }
				>
					<Icon icon={ wordpress } size={ size } />
					<IconSizeLabel size={ size } />
				</div>
			) ) }
		</>
	);
};

export const colors = () => {
	const iconColors = [ 'blue', 'purple', 'green' ];

	return (
		<>
			{ iconColors.map( ( color ) => (
				<div
					key={ color }
					style={ {
						padding: 20,
						display: 'inline-block',
						fill: color,
					} }
				>
					<Icon icon={ wordpress } />
					<IconSizeLabel size={ 24 } />
				</div>
			) ) }
		</>
	);
};

export const withAFunction = () => (
	<Icon
		icon={ () => (
			<SVG>
				<Path d="M5 4v3h5.5v12h3V7H19V4z" />
			</SVG>
		) }
	/>
);

export const withAComponent = () => {
	const MyIconComponent = () => (
		<SVG>
			<Path d="M5 4v3h5.5v12h3V7H19V4z" />
		</SVG>
	);

	return <Icon icon={ MyIconComponent } />;
};

export const withAnSVG = () => {
	return (
		<Icon
			icon={
				<SVG>
					<Path d="M5 4v3h5.5v12h3V7H19V4z" />
				</SVG>
			}
		/>
	);
};

/**
 * Although it's preferred to use icons from the `@wordpress/icons` package, Dashicons are still supported,
 * as long as you are in a context where the Dashicons stylesheet is loaded. To simulate that here,
 * use the Global CSS Injector in the Storybook toolbar at the top and select the "WordPress" preset.
 */
export const withADashicon = () => {
	return (
		<VStack>
			<Icon icon="wordpress" />
			<small>
				This won’t show an icon if the Dashicons stylesheet isn’t
				loaded.
			</small>
		</VStack>
	);
};
