/**
 * External dependencies
 */
import { number } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { Elevation } from '../index';
import { Grid } from '../../grid';
import { View } from '../../view';
import { HStack } from '../../h-stack';
import { Divider } from '../../divider';
import {
	ExampleGrid,
	ExampleGridItem,
	ExampleMetaContent,
} from '../../ui/__storybook-utils';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

export default {
	component: Elevation,
	title: 'Components (Experimental)/Elevation',
	parameters: {
		knobs: { disable: false },
	},
};

const ElevationWrapper = ( { children } ) => (
	<HStack alignment="center">
		<View
			style={ {
				position: 'relative',
				width: 40,
				height: 40,
			} }
		>
			{ children }
		</View>
	</HStack>
);

const elevations = new Array( 11 )
	.fill( 0 )
	.map( ( a, i ) => i )
	.map( ( index ) => {
		return [
			`x: 0px`,
			`y: ${ index }px`,
			`spread: ${ index * 2 }px`,
			`color: rgba(0, 0, 0, ${ index / 20 })`,
		];
	} );

export const _default = () => {
	return (
		<ExampleGrid>
			{ elevations.map( ( elevation, index ) => {
				return (
					<ExampleGridItem key={ index }>
						<View style={ { padding: 20, paddingBottom: 40 } }>
							<ElevationWrapper>
								<Elevation
									style={ { background: 'white' } }
									value={ index }
								/>
							</ElevationWrapper>
						</View>
						<Divider mt={ 3 } />
						<ExampleMetaContent title="value" items={ [ index ] } />
						<Divider mt={ 3 } />
						<ExampleMetaContent title="info" items={ elevation } />
					</ExampleGridItem>
				);
			} ) }
		</ExampleGrid>
	);
};

export const Focus = () => {
	const borderRadius = number( 'borderRadius', 0 );
	const value = number( 'value', 5 );
	const hover = number( 'hover', 5 );
	const active = number( 'active', 1 );
	const focus = number( 'focus', 10 );

	const Card = useCallback(
		( props ) => (
			<View
				{ ...props }
				as="a"
				href="#"
				onClick={ ( e ) => e.preventDefault() }
				style={ {
					display: 'block',
					width: 100,
					height: 100,
					borderRadius,
					position: 'relative',
					margin: '20vh auto 10vw',
				} }
			/>
		),
		[]
	);

	return (
		<View
			style={ {
				padding: '10vh',
			} }
		>
			<Grid columns={ 3 }>
				<Card>
					<Elevation
						borderRadius={ borderRadius }
						value={ value }
						focus={ focus }
						active={ active }
						hover={ hover }
					/>
				</Card>
				<Card>
					<Elevation
						borderRadius={ borderRadius }
						value={ value }
						focus={ focus }
						active={ active }
						hover={ hover }
					/>
				</Card>
				<Card>
					<Elevation
						borderRadius={ borderRadius }
						value={ value }
						focus={ focus }
						active={ active }
						hover={ hover }
					/>
				</Card>
			</Grid>
		</View>
	);
};
