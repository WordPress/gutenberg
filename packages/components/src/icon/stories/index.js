/**
 * External dependencies
 */
import { number, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Icon from '../';
import { SVG, Path } from '../../primitives/svg';

export default { title: 'Components|Icon', component: Icon };

const IconSizeLabel = ( { size } ) => <div style={ { fontSize: 12 } }>{ size }px</div>;

export const _default = () => {
	const icon = text( 'Icon', 'screenoptions' );
	const size = number( 'Size', '24' );

	return (
		<div>
			<Icon icon={ icon } size={ size } />
			<IconSizeLabel size={ size } />
		</div>
	);
};

export const sizes = () => {
	const iconSizes = [ 14, 16, 20, 24, 28, 32, 40, 48, 56 ];

	return (
		<>
			{ iconSizes.map( ( size ) => (
				<div key={ size } style={ { padding: 20, display: 'inline-block' } }>
					<Icon icon="screenoptions" size={ size } />
					<IconSizeLabel size={ size } />
				</div>
			) ) }
		</>
	);
};

export const colors = () => {
	const iconColors = [ 'blue', 'purple', 'green' ];

	/**
	 * The SVG icon inherits the color from a parent selector.
	 */

	return (
		<>
			{ iconColors.map( ( color ) => (
				<div
					key={ color }
					style={ { padding: 20, display: 'inline-block', color } }
				>
					<Icon icon="screenoptions" />
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
