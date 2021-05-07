/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

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
	const offset = isHover ? 0 : 20;

	return (
		<HStack>
			<View
				onMouseLeave={ () => setIsHover( false ) }
				onMouseEnter={ () => setIsHover( true ) }
			>
				<ZStack isLayered={ false } offset={ offset }>
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
