/**
 * External dependencies
 */
import { boolean, number } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { Elevation } from '../index';
import { Grid } from '../../grid';
import { View } from '../../view';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

export default {
	component: Elevation,
	title: 'G2 Components (Experimental)/Elevation',
};

export const _default = () => {
	const value = number( 'value', 5 );
	const borderRadius = number( 'borderRadius', 0 );
	const hover = number( 'hover', undefined );
	const active = number( 'active', undefined );
	const isInteractive = boolean( 'isInteractive', true );

	return (
		<View
			css={ {
				padding: '10vh',
				position: 'relative',
				margin: '20vh auto 10vw',
				maxWidth: 200,
			} }
		>
			<Elevation
				isInteractive={ isInteractive }
				value={ value }
				borderRadius={ borderRadius }
				hover={ hover }
				active={ active }
			/>
		</View>
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
				css={ {
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
			css={ {
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
