/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	createContext,
	Suspense,
	useEffect,
	useState,
} from '@wordpress/element';
import { Modal, Spinner } from '@wordpress/components';
import { useSuspenseSelect } from '@wordpress/data';

const LoadingScreenContext = createContext( false );

/**
 * Component that declares a data dependency.
 * Will suspend if data has not resolved.
 *
 * @param {Object}                                    props          Component props
 * @param {import('@wordpress/data').StoreDescriptor} props.store    Data store descriptor
 * @param {string}                                    props.selector Selector name
 * @param {Array}                                     props.args     Optional arguments to pass to the selector
 */
const SuspenseDataDependency = ( { store, selector, args = [] } ) => {
	useSuspenseSelect(
		( select ) => select( store )[ selector ]( ...args ),
		[]
	);

	return null;
};

/**
 * Component that will render a loading screen if dependencies have not resolved,
 * or its children if all dependencies have resolved.
 *
 * @param {Object}  props                  Component props
 * @param {Array}   props.dataDependencies Array of dependencies
 * @param {string}  props.children         Component children
 * @param {string?} props.overlayClassName Additional overlay classname
 */
const SuspenseWithLoadingScreen = ( {
	dataDependencies,
	children,
	overlayClassName,
} ) => {
	const [ loaded, setLoaded ] = useState( false );

	const finishedLoading = () => {
		if ( ! loaded ) {
			setLoaded( true );
		}
	};

	return (
		<LoadingScreenContext.Provider value={ loaded }>
			{ loaded ? (
				<>
					<LoadingScreen
						overlayClassName={ overlayClassName }
						autoClose
					/>
					{ children }
				</>
			) : (
				<Suspense
					fallback={
						<LoadingScreen
							onUnmount={ finishedLoading }
							overlayClassName={ overlayClassName }
						/>
					}
				>
					{ dataDependencies.map(
						( { store, selector, args }, depindex ) => (
							<SuspenseDataDependency
								key={ `suspense-dep-${ depindex }-${ store.name }-${ selector }` }
								store={ store }
								selector={ selector }
								args={ args }
							/>
						)
					) }
					{ children }
				</Suspense>
			) }
		</LoadingScreenContext.Provider>
	);
};

/**
 * Renders a loading screen.
 * Supports automatic closing with the `autoClose` prop.
 *
 * @param {Object}    props                  Component props
 * @param {Function?} props.onUnmount        Optional callback to call on unmount.
 * @param {boolean}   props.autoClose        Whether to automatically close.
 * @param {string?}   props.overlayClassName Additional overlay classname
 */
const LoadingScreen = ( { onUnmount, autoClose, overlayClassName } ) => {
	const [ visible, setVisible ] = useState( true );

	useEffect( () => {
		if ( autoClose ) {
			setTimeout( () => {
				setVisible( false );
			}, 2000 );
		}

		return () => {
			if ( onUnmount ) {
				onUnmount();
			}
		};
	} );

	if ( ! visible ) {
		return null;
	}

	return (
		<Modal
			isFullScreen
			isDismissible={ false }
			onRequestClose={ () => {} }
			__experimentalHideHeader
			className="block-editor-loading-screen-modal"
			overlayClassName={ classNames(
				'block-editor-loading-screen-modal-overlay',
				overlayClassName
			) }
		>
			<div className="block-editor-loading-screen-wrapper">
				<Spinner />
			</div>
		</Modal>
	);
};

export default SuspenseWithLoadingScreen;
