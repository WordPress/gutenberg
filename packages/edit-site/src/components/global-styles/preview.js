/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Card,
	ColorIndicator,
	Dropdown,
} from '@wordpress/components';
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { useStyle } from './hooks';
import Variations from './variations';

const StylesPreview = () => {
	const [ fontFamily = 'serif' ] = useStyle( 'typography.fontFamily' );
	const [ textColor = 'black' ] = useStyle( 'color.text' );
	const [ linkColor = 'blue' ] = useStyle( 'elements.link.color.text' );
	const [ backgroundColor = 'white' ] = useStyle( 'color.background' );
	const [ gradientValue ] = useStyle( 'color.gradient' );

	return (
		<Dropdown
			className="edit-site-global-styles-preview__dropdown"
			contentClassName="edit-site-global-styles-preview__popover"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const openOnEnter = ( event ) => {
					if ( ! isOpen && event.keyCode === ENTER ) {
						event.preventDefault();
						onToggle();
					}
				};

				return (
					<Card
						className="edit-site-global-styles-preview"
						style={ {
							background: gradientValue ?? backgroundColor,
						} }
						role="button"
						onClick={ onToggle }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						onKeyDown={ openOnEnter }
						position="bottom middle"
					>
						<HStack spacing={ 5 }>
							<div
								style={ {
									fontFamily,
									fontSize: '80px',
									color: textColor,
								} }
							>
								Aa
							</div>
							<VStack spacing={ 2 }>
								<ColorIndicator colorValue={ textColor } />
								<ColorIndicator colorValue={ linkColor } />
							</VStack>
						</HStack>
					</Card>
				);
			} }
			renderContent={ () => {
				return <Variations />;
			} }
		/>
	);
};

export default StylesPreview;
