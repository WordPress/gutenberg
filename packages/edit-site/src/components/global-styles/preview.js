/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Card,
	ColorIndicator,
} from '@wordpress/components';

/**
 * Internal dependencies
 */ import { useGlobalStylesContext } from '../editor/global-styles-provider';

const StylesPreview = () => {
	const { getStyle } = useGlobalStylesContext();
	const fontFamily = getStyle( 'root', 'fontFamily' ) ?? 'serif';
	const textColor = getStyle( 'root', 'color' ) ?? 'black';
	const linkColor = getStyle( 'root', 'linkColor' ) ?? 'blue';
	const backgroundColor = getStyle( 'root', 'backgroundColor' ) ?? 'white';

	return (
		<Card
			className="edit-site-global-styles-preview"
			style={ { background: backgroundColor } }
		>
			<HStack spacing={ 5 }>
				<div>
					<span style={ { fontFamily, fontSize: '80px' } }>A</span>
					<span style={ { fontFamily, fontSize: '80px' } }>a</span>
				</div>
				<VStack spacing={ 2 }>
					<ColorIndicator colorValue={ textColor } />
					<ColorIndicator colorValue={ linkColor } />
				</VStack>
			</HStack>
		</Card>
	);
};

export default StylesPreview;
