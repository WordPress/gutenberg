/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
/**
 * External dependencies
 */
import { boolean, number } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { Elevation } from '../../ui/elevation';
import { HStack } from '../../h-stack';
import { View } from '../../view';
import { ZStack } from '..';

export default {
	component: ZStack,
	title: 'Components (Experimental)/ZStack',
};

const Avatar = ( { backgroundColor } ) => {
	return (
		<View>
			<View
				style={ {
					border: '3px solid black',
					borderRadius: '9999px',
					height: '48px',
					width: '48px',
					backgroundColor,
				} }
			/>
			<Elevation
				borderRadius={ 9999 }
				isInteractive={ false }
				value={ 3 }
			/>
		</View>
	);
};

const AnimatedAvatars = () => {
	const [ isHover, setIsHover ] = useState( false );
	const overlap = number( 'overlap', 20 );
	const props = {
		overlap: isHover ? 0 : overlap,
		isLayered: boolean( 'isLayered', false ),
		isReversed: boolean( 'isReversed', false ),
	};

	return (
		<HStack>
			<View
				onMouseLeave={ () => setIsHover( false ) }
				onMouseEnter={ () => setIsHover( true ) }
			>
				<ZStack { ...props }>
					<Avatar backgroundColor="#444" />
					<Avatar backgroundColor="#777" />
					<Avatar backgroundColor="#aaa" />
					<Avatar backgroundColor="#fff" />
				</ZStack>
			</View>
		</HStack>
	);
};

export const _default = () => {
	return (
		<View>
			<AnimatedAvatars />
		</View>
	);
};
