import { __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
} from '@wordpress/components';
import { NavigationButtonAsItem } from './navigation-button';
import { Subtitle } from './subtitle';
import { useStyle } from './hooks';

interface ElementItemProps {
	parentMenu: string;
	element: string;
	label: string;
}

interface TypographyElementsProps {
	elements: Omit< ElementItemProps, 'parentMenu' >[];
	parentMenu: string;
	title?: string;
}

function ElementItem( { parentMenu, element, label }: ElementItemProps ) {
	const prefix =
		element === 'text' || ! element ? '' : `elements.${ element }.`;
	const extraStyles =
		element === 'link'
			? {
					textDecoration: 'underline',
			  }
			: {};

	const [ fontFamily ] = useStyle< string >(
		prefix + 'typography.fontFamily'
	);
	const [ fontStyle ] = useStyle< string >( prefix + 'typography.fontStyle' );
	const [ fontWeight ] = useStyle< string >(
		prefix + 'typography.fontWeight'
	);
	const [ backgroundColor ] = useStyle< string >(
		prefix + 'color.background'
	);
	const [ fallbackBackgroundColor ] =
		useStyle< string >( 'color.background' );
	const [ gradientValue ] = useStyle< string >( prefix + 'color.gradient' );
	const [ color ] = useStyle< string >( prefix + 'color.text' );

	return (
		<NavigationButtonAsItem path={ parentMenu + '/typography/' + element }>
			<HStack justify="flex-start">
				<FlexItem
					className="global-styles-ui-screen-typography__indicator"
					aria-hidden="true"
					style={ {
						fontFamily: fontFamily ?? 'serif',
						background:
							gradientValue ??
							backgroundColor ??
							fallbackBackgroundColor,
						color,
						fontStyle,
						fontWeight,
						...extraStyles,
					} }
				>
					{ __( 'Aa' ) }
				</FlexItem>
				<FlexItem>{ label }</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

function TypographyElements( {
	elements,
	parentMenu,
	title,
}: TypographyElementsProps ) {
	return (
		<VStack spacing={ 3 }>
			{ title && <Subtitle level={ 3 }>{ title }</Subtitle> }
			<ItemGroup isBordered isSeparated>
				{ elements.map( ( { element, label } ) => (
					<ElementItem
						key={ element }
						parentMenu={ parentMenu }
						element={ element }
						label={ label }
					/>
				) ) }
			</ItemGroup>
		</VStack>
	);
}

export default TypographyElements;
