/**
 * External dependencies
 */
import classnames from 'classnames';

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
	MenuGroup,
	MenuItem,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalGrid as Grid,
	__experimentalInputControl as InputControl,
} from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { MoreMenuDropdown } from '@wordpress/interface';

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
	useUserChangesMatchAnyVariation,
} from './hooks';
import { compareVariations } from './utils';

/* eslint-disable dot-notation */

function Variation( { variation, userChangesMatchAnyVariation } ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const { base, user, setUserConfig } = useContext( GlobalStylesContext );
	const { hasEditsForEntityRecord } = useSelect( coreStore );
	const { globalStyleId } = useSelect( ( select ) => {
		return {
			globalStyleId:
				select( coreStore ).__experimentalGetCurrentGlobalStylesId(),
		};
	}, [] );

	// StylesPreview needs to be wrapped in a custom context so that the styles
	// appear correctly. Otherwise, they would be overriden by current user
	// settings.
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
		/* eslint-disable no-alert */
		if (
			! userChangesMatchAnyVariation &&
			hasEditsForEntityRecord( 'root', 'globalStyles', globalStyleId ) &&
			! window.confirm(
				__(
					'Are you sure you want to switch to this variation? Unsaved changes will be lost.'
				)
			)
		) {
			return;
		}
		/* eslint-enable no-alert */

		setUserConfig( () => {
			return {
				settings: variation.settings,
				styles: variation.styles,
				associated_style_id: 0,
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
				<GlobalStylesContext.Provider value={ context }>
					<StylesPreview
						label={ variation?.title }
						isFocused={ isFocused }
						withHoverView
					/>
				</GlobalStylesContext.Provider>
			</div>
		</div>
	);
}

function UserVariation( { variation, userChangesMatchAnyVariation } ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const { base, user, setUserConfig } = useContext( GlobalStylesContext );
	const associatedStyleId = user[ 'associated_style_id' ];
	const { hasEditsForEntityRecord, hasFinishedResolution } =
		useSelect( coreStore );
	const {
		deleteEntityRecord,
		__experimentalRefreshUserGlobalStylesVariations,
	} = useDispatch( coreStore );
	const { globalStyleId } = useSelect( ( select ) => {
		return {
			globalStyleId:
				select( coreStore ).__experimentalGetCurrentGlobalStylesId(),
		};
	}, [] );

	const isMoreMenuClick = useCallback( ( e ) => {
		if (
			e.target.closest( '.components-dropdown-menu__toggle' ) ||
			e.target.closest( '.components-menu-item__button' )
		) {
			return true;
		}

		return false;
	}, [] );

	// StylesPreview needs to be wrapped in a custom context so that the styles
	// appear correctly. Otherwise, they would be overriden by current user
	// settings.
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

	const isActive = useMemo(
		() => variation.id === associatedStyleId,
		[ variation, associatedStyleId ]
	);

	const selectVariation = useCallback(
		( e ) => {
			if ( isMoreMenuClick( e ) ) {
				return;
			}

			/* eslint-disable no-alert */
			if (
				! userChangesMatchAnyVariation &&
				hasEditsForEntityRecord(
					'root',
					'globalStyles',
					globalStyleId
				) &&
				! window.confirm(
					__(
						'Are you sure you want to switch to this variation? Unsaved changes will be lost.'
					)
				)
			) {
				return;
			}
			/* eslint-enable no-alert */

			setUserConfig( () => ( {
				settings: variation.settings,
				styles: variation.styles,
				associated_style_id: variation.id,
			} ) );
		},
		[ variation, globalStyleId, userChangesMatchAnyVariation ]
	);

	const selectOnEnter = ( event ) => {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			selectVariation();
		}
	};

	const deleteStyleHandler = useCallback( () => {
		if (
			! hasFinishedResolution( 'getEditedEntityRecord', [
				'root',
				'globalStyles',
				variation.id,
			] )
		) {
			return;
		}

		// If this is the associated variation, remove the association
		if ( associatedStyleId === variation.id ) {
			setUserConfig( ( currentConfig ) => ( {
				...currentConfig,
				associated_style_id: 0,
			} ) );
		}

		deleteEntityRecord( 'root', 'globalStyles', variation.id ).then( () => {
			__experimentalRefreshUserGlobalStylesVariations();
		} );
	}, [
		variation,
		associatedStyleId,
		__experimentalRefreshUserGlobalStylesVariations,
	] );

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
				<GlobalStylesContext.Provider value={ context }>
					<StylesPreview
						label={ variation?.title }
						isFocused={ isFocused }
						withHoverView
					/>
				</GlobalStylesContext.Provider>
			</div>
			<MoreMenuDropdown>
				{ () => (
					<MenuGroup>
						<MenuItem onClick={ deleteStyleHandler }>
							{ __( 'Delete style' ) }
						</MenuItem>
					</MenuGroup>
				) }
			</MoreMenuDropdown>
		</div>
	);
}

function ScreenStyleVariations() {
	const [ createNewVariationModalOpen, setCreateNewVariationModalOpen ] =
		useState( false );
	const [ newStyleName, setNewStyleName ] = useState( '' );
	const [ isStyleRecordSaving, setIsStyleRecordSaving ] = useState( false );
	const { setUserConfig } = useContext( GlobalStylesContext );

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
	const allVariations = useMemo( () => {
		const ret = [];
		if ( Array.isArray( withEmptyVariation ) ) {
			ret.push( ...withEmptyVariation );
		}
		if ( Array.isArray( userVariations ) ) {
			ret.push( ...userVariations );
		}
		return ret;
	}, [ withEmptyVariation, userVariations ] );

	const userChangesMatchAnyVariation =
		useUserChangesMatchAnyVariation( allVariations );

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

	return (
		<>
			<ScreenHeader
				back="/"
				title={ __( 'Browse styles' ) }
				description={ __(
					'Choose a variation to change the look of the site.'
				) }
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
									userChangesMatchAnyVariation={
										userChangesMatchAnyVariation
									}
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
							<Variation
								key={ index }
								variation={ variation }
								userChangesMatchAnyVariation={
									userChangesMatchAnyVariation
								}
							/>
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
								createNewStyleRecord().then( ( variation ) => {
									// Set new variation as the associated one.
									if ( variation?.id ) {
										setUserConfig( ( currentConfig ) => ( {
											...currentConfig,
											associated_style_id: variation.id,
										} ) );
									}

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
