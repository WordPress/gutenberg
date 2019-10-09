/**
 * Internal dependencies
 */
import Icon from '../';
import { SVG, Path } from '../../';

export default { title: 'Icon', component: Icon };

const IconSizeLabel = ( { size } ) => <div style={ { fontSize: 12 } }>{ size }px</div>;

export const _default = () => (
	<div>
		<Icon icon="screenoptions" />
		<IconSizeLabel size={ 24 } />
	</div>
);

export const Sizes = () => {
	const sizes = [ 14, 16, 20, 24, 28, 32, 40, 48, 56 ];

	return (
		<>
			{ sizes.map( ( size ) => (
				<div key={ size } style={ { padding: 20, display: 'inline-block' } }>
					<Icon icon="screenoptions" size={ size } />
					<IconSizeLabel size={ size } />
				</div>
			) ) }
		</>
	);
};

export const Colors = () => {
	const colors = [ 'blue', 'purple', 'green' ];

	/**
	 * The SVG icon inherits the color from a parent selector.
	 */

	return (
		<>
			{ colors.map( ( color ) => (
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

export const WithAFunction = () => (
	<Icon
		icon={ () => (
			<SVG>
				<Path d="M5 4v3h5.5v12h3V7H19V4z" />
			</SVG>
		) }
	/>
);

export const WithAComponent = () => {
	const MyIconComponent = () => (
		<SVG>
			<Path d="M5 4v3h5.5v12h3V7H19V4z" />
		</SVG>
	);

	return <Icon icon={ MyIconComponent } />;
};

export const WithAnSVG = () => {
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
