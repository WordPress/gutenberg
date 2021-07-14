/**
 * External dependencies
 */
import { isUndefined, startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	__experimentalGrid as Grid,
	__experimentalHeading as Heading,
	__experimentalNumberControl as NumberControl,
	__experimentalVStack as VStack,
	Button,
	ButtonGroup,
	CardBody,
	DropdownMenu,
	FontSizePicker,
	Panel,
	SelectControl,
	TextControl,
	useNavigatorParams,
} from '@wordpress/components';
import {
	check,
	formatCapitalize,
	formatLowercase,
	formatUppercase,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Screen, ScreenHeader } from '../components';
import { useAppState } from '../state';

const typographyOptions = [
	{
		title: 'Font',
		value: 'fontFamily',
		defaultValue: 'Helvetica Neue',
	},
	{
		title: 'Size',
		value: 'fontSize',
		defaultValue: '14px',
	},
	{
		title: 'Appearance',
		value: 'fontWeight',
		defaultValue: '400',
	},
	{
		title: 'Line height',
		value: 'lineHeight',
		defaultValue: '1.5',
	},
	{
		title: 'Letter spacing',
		value: 'letterSpacing',
		defaultValue: '0',
	},
	{
		title: 'Letter case',
		value: 'letterCase',
		defaultValue: null,
	},
];

const TypographyOptions = () => {
	const {
		attributes: { styles },
		toggleAttribute,
	} = useStyleAttributesForScreen();

	const options = typographyOptions.map( ( o ) => {
		const isActive = ! isUndefined( styles[ o.value ] );
		return {
			...o,
			isActive,
			onClick: () => toggleAttribute( o.value, o.defaultValue ),
			icon: isActive ? check : undefined,
		};
	} );

	return <DropdownMenu controls={ options } />;
};

const Header = ( { title } ) => {
	return (
		<ScreenHeader
			action={ <TypographyOptions /> }
			back="/typography"
			description={ `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
				congue finibus ante vel maximus.` }
			title={ title }
		/>
	);
};

function useStyleAttributesForScreen() {
	const { id } = useNavigatorParams();
	const appState = useAppState();
	const { get, set } = appState;

	let index;
	const attributes = appState.typography.elements.find( ( e, i ) => {
		if ( e.slug === id ) {
			index = i;
			return true;
		}
		return false;
	} );

	const getPath = ( attr ) =>
		`typography.elements[${ index }].styles.${ attr }`;

	const getAttribute = ( attr ) => attributes.styles[ attr ];
	const setAttribute = ( attr ) => ( next ) => {
		const path = getPath( attr );
		const value = isUndefined( next ) ? null : next;
		set( path, value );
	};
	const toggleAttribute = ( attr, defaultValue = undefined ) => {
		const path = getPath( attr );
		const current = get( path );
		if ( isUndefined( current ) ) {
			set( path, defaultValue );
		} else {
			set( path, undefined );
		}
	};

	const getIsDefined = ( attr ) => {
		const path = getPath( attr );
		const current = get( path );
		return ! isUndefined( current );
	};

	return {
		getAttribute,
		setAttribute,
		toggleAttribute,
		getIsDefined,
		attributes,
	};
}

const fontWeights = [ 100, 200, 300, 400, 500, 600, 700, 800, 900 ];
const fontWeightOptions = fontWeights.map( ( value ) => ( {
	value,
	label: value,
} ) );

const RenderComponent = ( { children, prop } ) => {
	if ( isUndefined( prop ) || prop === false ) return null;
	return children;
};

export const TypographyElementScreen = () => {
	const { id } = useNavigatorParams();
	const title = startCase( id );
	const {
		getAttribute,
		getIsDefined,
		setAttribute,
	} = useStyleAttributesForScreen();
	const bindAttribute = ( attr, props = {} ) => ( {
		...props,
		value: getAttribute( attr ) || props.defaultValue,
		onChange: setAttribute( attr ),
	} );

	return (
		<Screen>
			<CardBody>
				<VStack spacing={ 8 }>
					<Header title={ title } />
					<Panel>
						<RenderComponent prop={ getIsDefined( 'fontFamily' ) }>
							<TextControl
								label="Font"
								{ ...bindAttribute( 'fontFamily' ) }
							/>
						</RenderComponent>
						<RenderComponent prop={ getIsDefined( 'fontSize' ) }>
							<Grid>
								<FontSizePicker
									{ ...bindAttribute( 'fontSize' ) }
									withSlider
								/>
							</Grid>
						</RenderComponent>
						<Grid>
							<RenderComponent
								prop={ getIsDefined( 'fontWeight' ) }
							>
								<SelectControl
									label="Appearance"
									{ ...bindAttribute( 'fontWeight', {
										defaultValue: 400,
									} ) }
									options={ fontWeightOptions }
								/>
							</RenderComponent>
							<RenderComponent
								prop={ getIsDefined( 'lineHeight' ) }
							>
								<TextControl
									label="Line Height"
									arrows="stepper"
									min={ 0 }
									step={ 0.1 }
									type="number"
									{ ...bindAttribute( 'lineHeight' ) }
								/>
							</RenderComponent>
							<RenderComponent
								prop={ getIsDefined( 'letterSpacing' ) }
							>
								<NumberControl
									label="Letter spacing"
									arrows="stepper"
									min={ 0 }
									step={ 0.1 }
									type="number"
									{ ...bindAttribute( 'letterSpacing', {
										defaultValue: 0,
									} ) }
								/>
							</RenderComponent>
							<RenderComponent
								prop={ getIsDefined( 'letterCase' ) }
							>
								<Heading level="h5">Letter case</Heading>
								<ButtonGroup
									enableSelectNone
									{ ...bindAttribute( 'letterCase', {
										defaultValue: null,
									} ) }
								>
									<Button
										icon={ formatUppercase }
										value="uppercase"
									/>
									<Button
										icon={ formatLowercase }
										value="lowercase"
									/>
									<Button
										icon={ formatCapitalize }
										value="capitalize"
									/>
								</ButtonGroup>
							</RenderComponent>
						</Grid>
					</Panel>
				</VStack>
			</CardBody>
		</Screen>
	);
};
