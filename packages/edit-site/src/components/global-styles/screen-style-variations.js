/**
 * External dependencies
 */
import classnames from 'classnames';
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useMemo,
	useCallback,
	useContext,
	useState,
	useEffect,
	useRef,
} from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import {
	Card,
	CardBody,
	CardDivider,
	Button,
	Modal,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalGrid as Grid,
	__experimentalInputControl as InputControl,
} from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import { GlobalStylesContext } from './context';
import StylesPreview from './preview';
import ScreenHeader from './header';
import {
	useHasUserModifiedStyles,
	useCreateNewStyleRecord,
	useCustomSavedStyles,
} from './hooks';

/* eslint-disable dot-notation */

function compareVariations( a, b ) {
	return (
		fastDeepEqual( a.styles, b.styles ) &&
		fastDeepEqual( a.settings, b.settings )
	);
}

function Variation( { variation } ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const { base, user, setUserConfig } = useContext( GlobalStylesContext );
	const context = useMemo( () => {
		return {
			user: {
				settings: variation.settings ?? {},
				styles: variation.styles ?? {},
			},
			base,
			merged: mergeBaseAndUserConfigs( base, variation ),
			setUserConfig: () => {},
		};
	}, [ variation, base ] );

	const selectVariation = () => {
		setUserConfig( () => {
			return {
				settings: variation.settings,
				styles: variation.styles,
			};
		} );
	};

	const selectOnEnter = ( event ) => {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			selectVariation();
		}
	};

	const isActive = useMemo( () => {
		return compareVariations( user, variation );
	}, [ user, variation ] );

	return (
		<GlobalStylesContext.Provider value={ context }>
			<div
				className={ classnames(
					'edit-site-global-styles-variations_item',
					{
						'is-active': isActive,
					}
				) }
				role="button"
				onClick={ selectVariation }
				onKeyDown={ selectOnEnter }
				tabIndex="0"
				aria-label={ variation?.title }
				aria-current={ isActive }
				onFocus={ () => setIsFocused( true ) }
				onBlur={ () => setIsFocused( false ) }
			>
				<div className="edit-site-global-styles-variations_item-preview">
					<StylesPreview
						label={ variation?.title }
						isFocused={ isFocused }
						withHoverView
					/>
				</div>
			</div>
		</GlobalStylesContext.Provider>
	);
}

function UserVariation( { variation } ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const { user, setUserConfig } = useContext( GlobalStylesContext );
	const associatedStyleId = user[ 'associated_style_id' ];

	const isActive = useMemo(
		() => variation.id === associatedStyleId,
		[ variation, associatedStyleId ]
	);

	const selectVariation = useCallback( () => {
		setUserConfig( () => ( {
			settings: variation.settings,
			styles: variation.styles,
			associated_style_id: variation.id,
		} ) );
	}, [ variation ] );

	const selectOnEnter = ( event ) => {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			selectVariation();
		}
	};

	return (
		<div
			className={ classnames( 'edit-site-global-styles-variations_item', {
				'is-active': isActive,
			} ) }
			role="button"
			onClick={ selectVariation }
			onKeyDown={ selectOnEnter }
			tabIndex="0"
			aria-label={ variation?.title }
			aria-current={ isActive }
			onFocus={ () => setIsFocused( true ) }
			onBlur={ () => setIsFocused( false ) }
		>
			<div className="edit-site-global-styles-variations_item-preview">
				<StylesPreview
					label={ variation?.title }
					isFocused={ isFocused }
					withHoverView
				/>
			</div>
		</div>
	);
}

function ScreenStyleVariations() {
	const [ createNewVariationModalOpen, setCreateNewVariationModalOpen ] =
		useState( false );
	const [ newStyleName, setNewStyleName ] = useState( '' );
	const [ isStyleRecordSaving, setIsStyleRecordSaving ] = useState( false );
	const { user } = useContext( GlobalStylesContext );

	const {
		__experimentalHasAssociatedVariationChanged,
		getEditedEntityRecord,
	} = useSelect( coreStore );
	const { variations, mode } = useSelect( ( select ) => {
		return {
			variations:
				select( coreStore ).__experimentalGetGlobalStylesVariations(),

			mode: select( blockEditorStore ).__unstableGetEditorMode(),
		};
	}, [] );

	const withEmptyVariation = useMemo( () => {
		return [
			{
				title: __( 'Default' ),
				settings: {},
				styles: {},
			},
			...variations.map( ( variation ) => ( {
				...variation,
				settings: variation.settings ?? {},
				styles: variation.styles ?? {},
			} ) ),
		];
	}, [ variations ] );

	const hasUserModifiedStyles = useHasUserModifiedStyles();
	const userVariations = useCustomSavedStyles();

	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );
	const shouldRevertInitialMode = useRef( null );
	useEffect( () => {
		// ignore changes to zoom-out mode as we explictily change to it on mount.
		if ( mode !== 'zoom-out' ) {
			shouldRevertInitialMode.current = false;
		}
	}, [ mode ] );

	// Intentionality left without any dependency.
	// This effect should only run the first time the component is rendered.
	// The effect opens the zoom-out view if it is not open before when applying a style variation.
	useEffect( () => {
		if ( mode !== 'zoom-out' ) {
			__unstableSetEditorMode( 'zoom-out' );
			shouldRevertInitialMode.current = true;
			return () => {
				// if there were not mode changes revert to the initial mode when unmounting.
				if ( shouldRevertInitialMode.current ) {
					__unstableSetEditorMode( mode );
				}
			};
		}
	}, [] );

	const createNewStyleRecord = useCreateNewStyleRecord( newStyleName );

	// TODO Wrap in useCallback
	// Needs to be done on back button click, otherwise if getEditedEntityRecord is called
	// when a variation is clicked, there is an ugly screen re-render that resets navigation.
	const handleBackButtonClick = () => {
		if (
			user[ 'associated_style_id' ] &&
			__experimentalHasAssociatedVariationChanged()
		) {
			getEditedEntityRecord(
				'root',
				'globalStyles',
				user[ 'associated_style_id' ]
			);
		}
	};

	return (
		<>
			<ScreenHeader
				back="/"
				title={ __( 'Browse styles' ) }
				description={ __(
					'Choose a variation to change the look of the site.'
				) }
				onBackButtonClick={ handleBackButtonClick }
			/>
			<Card isBorderless>
				<CardBody>
					<HStack
						className="edit-site-global-styles__cs"
						justifyContent="space-between"
						alignItems="center"
					>
						<Heading level={ 2 }>{ __( 'Custom styles' ) }</Heading>
						<Button
							disabled={ ! hasUserModifiedStyles }
							onClick={ () =>
								setCreateNewVariationModalOpen( true )
							}
							icon={ plus }
						/>
					</HStack>
					{ userVariations && userVariations.length > 0 ? (
						<Grid columns={ 2 }>
							{ userVariations?.map( ( variation ) => (
								<UserVariation
									key={ variation.id }
									variation={ variation }
								/>
							) ) }
						</Grid>
					) : (
						<Text color="#979797">
							{ __( 'No custom styles yet.' ) }
						</Text>
					) }
				</CardBody>

				<CardDivider />

				<CardBody>
					<Heading level={ 2 }>{ __( 'Theme styles' ) }</Heading>
					<Grid columns={ 2 }>
						{ withEmptyVariation?.map( ( variation, index ) => (
							<Variation key={ index } variation={ variation } />
						) ) }
					</Grid>
				</CardBody>
			</Card>
			{ createNewVariationModalOpen && (
				<Modal
					title={ __( 'Create style' ) }
					onRequestClose={ () =>
						setCreateNewVariationModalOpen( false )
					}
				>
					<div className="edit-site-global-styles__cs-content">
						<InputControl
							label={ __( 'Style name' ) }
							value={ newStyleName }
							onChange={ ( nextValue ) =>
								setNewStyleName( nextValue ?? '' )
							}
						/>
						<Button
							onClick={ () => {
								createNewStyleRecord().then( () => {
									setIsStyleRecordSaving( false );
									setCreateNewVariationModalOpen( false );
								} );
								setIsStyleRecordSaving( true );
							} }
							variant="primary"
							isBusy={ isStyleRecordSaving }
						>
							{ __( 'Create' ) }
						</Button>
					</div>
				</Modal>
			) }
		</>
	);
}

/* eslint-enable dot-notation */

export default ScreenStyleVariations;
