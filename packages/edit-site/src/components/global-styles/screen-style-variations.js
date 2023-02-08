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
	useContext,
	useState,
	useEffect,
	useRef,
} from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import {
	__experimentalGrid as Grid,
	Card,
	CardBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	store as blockEditorStore,
	experiments as blockEditorExperiments,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import StylesPreview from './preview';
import ScreenHeader from './header';
import { unlock } from '../../experiments';

const { GlobalStylesContext } = unlock( blockEditorExperiments );

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

function ScreenStyleVariations() {
	const { variations, mode } = useSelect( ( select ) => {
		return {
			variations:
				select(
					coreStore
				).__experimentalGetCurrentThemeGlobalStylesVariations(),

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

	return (
		<>
			<ScreenHeader
				back="/"
				title={ __( 'Browse styles' ) }
				description={ __(
					'Choose a variation to change the look of the site.'
				) }
			/>

			<Card size="small" isBorderless>
				<CardBody>
					<Grid columns={ 2 }>
						{ withEmptyVariation?.map( ( variation, index ) => (
							<Variation key={ index } variation={ variation } />
						) ) }
					</Grid>
				</CardBody>
			</Card>
		</>
	);
}

export default ScreenStyleVariations;
