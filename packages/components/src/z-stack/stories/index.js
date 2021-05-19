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
	title: 'Components/ZStack',
};

const Avatar = () => {
	return (
		<View>
			<View
				style={ {
					border: '3px solid black',
					borderRadius: '9999px',
					height: '48px',
					width: '48px',
					backgroundColor: 'lightgray',
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
	const hoveredOffset = number( 'offset', 20 );
	const props = {
		offset: isHover ? 0 : hoveredOffset,
		isLayered: boolean( 'isLayerd', false ),
	};

	return (
		<HStack>
			<View
				onMouseLeave={ () => setIsHover( false ) }
				onMouseEnter={ () => setIsHover( true ) }
			>
				<ZStack { ...props }>
					<Avatar />
					<Avatar />
					<Avatar />
					<Avatar />
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
