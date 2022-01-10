/**
 * External dependencies
 */
import classnames from 'classnames';

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
 */
import { useStyle } from './hooks';

const StylesPreview = ( props ) => {
	const [ fontFamily = 'serif' ] = useStyle( 'typography.fontFamily' );
	const [ textColor = 'black' ] = useStyle( 'color.text' );
	const [ linkColor = 'blue' ] = useStyle( 'elements.link.color.text' );
	const [ backgroundColor = 'white' ] = useStyle( 'color.background' );
	const [ gradientValue ] = useStyle( 'color.gradient' );

	return (
		<Card
			{ ...props }
			style={ {
				background: gradientValue ?? backgroundColor,
				...props.style,
			} }
			className={ classnames(
				'edit-site-global-styles-preview',
				props.className
			) }
		>
			<HStack
				spacing={ 5 }
				className="edit-site-global-styles-preview__content"
			>
				<div style={ { fontFamily, fontSize: '80px' } }>Aa</div>
				<VStack spacing={ 2 }>
					<ColorIndicator colorValue={ textColor } />
					<ColorIndicator colorValue={ linkColor } />
				</VStack>
			</HStack>
		</Card>
	);
};

export default StylesPreview;
