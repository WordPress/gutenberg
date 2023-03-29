/**
 * External dependencies
 */
import { Command } from 'cmdk';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Modal, Button, Spinner } from '@wordpress/components';
import { Icon, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';

function CommandsPerPage( { search, navigateToPage, loader, commands } ) {
	const { isLoading, commands: loaderCommands = [] } =
		loader( { search } ) ?? {};
	const allCommands = [ ...commands, ...loaderCommands ];

	return (
		<>
			<Command.List>
				{ isLoading && (
					<Command.Loading>
						<Spinner />
					</Command.Loading>
				) }
				{ ! isLoading && ! allCommands?.length && (
					<Command.Empty>{ __( 'No results found.' ) }</Command.Empty>
				) }

				{ allCommands.map( ( command ) => (
					<Command.Item
						key={ command.name }
						value={ command.name }
						onSelect={ () =>
							command.callback( { navigateToPage } )
						}
					>
						{ command.label }
					</Command.Item>
				) ) }
			</Command.List>
		</>
	);
}

export function CommandMenu() {
	const [ search, setSearch ] = useState( '' );
	const [ open, setOpen ] = useState( false );
	const [ pages, setPages ] = useState( [] );
	const navigateToPage = ( newPage ) => setPages( [ ...pages, newPage ] );
	const currentPage = pages.length ? pages[ pages.length - 1 ] : null;
	const { commands, loader, placeholder } = useSelect(
		( select ) => {
			const { getCommands, getCommandLoader, getPagePlaceholder } =
				select( commandsStore );
			return {
				commands: getCommands( currentPage ),
				loader: getCommandLoader( currentPage ),
				placeholder: getPagePlaceholder( currentPage ),
			};
		},
		[ currentPage ]
	);
	const goBack = () =>
		setPages( ( currentPages ) => currentPages.slice( 0, -1 ) );

	// loader is actually a custom hook
	// so to avoid breaking the rules of hooks
	// the CommandsPerPage component need to be
	// remounted on each loader change
	// We use the key state to make sure we do that properly.
	const currentLoader = useRef( loader );
	const [ key, setKey ] = useState( 0 );
	useEffect( () => {
		if ( currentLoader.current !== loader ) {
			currentLoader.current = loader;
			setKey( ( prevKey ) => prevKey + 1 );
		}
	}, [ loader ] );

	// Toggle the menu when ⌘K is pressed
	useEffect( () => {
		const down = ( e ) => {
			if ( e.key === 'k' && e.metaKey ) {
				setOpen( ( prevOpen ) => ! prevOpen );
			}
		};

		document.addEventListener( 'keydown', down );
		return () => document.removeEventListener( 'keydown', down );
	}, [] );

	useEffect( () => {
		if ( ! open ) {
			setPages( [] );
		}
	}, [ open ] );

	if ( ! open ) {
		return false;
	}

	return (
		<Modal
			className="commands-command-menu"
			onRequestClose={ () => setOpen( false ) }
			__experimentalHideHeader
		>
			<div className="commands-command-menu__container">
				<Command label={ __( 'Global Command Menu' ) }>
					<div className="commands-command-menu__header">
						{ pages.length > 0 && (
							<Button onClick={ goBack }>
								<Icon icon={ chevronLeft } size={ 24 } />
							</Button>
						) }
						<Command.Input
							// The input should be focused when the modal is opened.
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus
							value={ search }
							onValueChange={ setSearch }
							placeholder={ placeholder ?? __( 'Ask anything' ) }
							onKeyDown={ ( event ) => {
								if (
									event.key === 'Backspace' &&
									search === ''
								) {
									goBack();
								}
							} }
						/>
					</div>
					<CommandsPerPage
						key={ key }
						navigateToPage={ navigateToPage }
						loader={ currentLoader.current }
						commands={ commands }
						search={ search }
					/>
				</Command>
			</div>
		</Modal>
	);
}
