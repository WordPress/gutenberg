/**
 * WordPress dependencies
 */
import { Suspense, useEffect, useState } from '@wordpress/element';
import { Modal, Spinner } from '@wordpress/components';
import { LoadingScreenContext } from '@wordpress/data';

const SuspenseWithLoadingScreen = ( { children } ) => {
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
					<LoadingScreen autoClose />
					{ children }
				</>
			) : (
				<Suspense
					fallback={ <LoadingScreen onUnmount={ finishedLoading } /> }
				>
					{ children }
				</Suspense>
			) }
		</LoadingScreenContext.Provider>
	);
};

const LoadingScreen = ( { onUnmount, autoClose } ) => {
	const [ visible, setVisible ] = useState( true );

	useEffect( () => {
		if ( autoClose ) {
			setTimeout( () => {
				setVisible( false );
			}, 1000 );
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
			overlayClassName="block-editor-loading-screen-modal-overlay"
		>
			<div className="block-editor-loading-screen-wrapper">
				<Spinner style={ { width: 64, height: 64 } } />
			</div>
		</Modal>
	);
};

export default SuspenseWithLoadingScreen;
