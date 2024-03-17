/**
 * External dependencies
 */
import type { CSSProperties } from 'react';
import type { StoryFn, Meta } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useId, useState } from '@wordpress/element';
import { chevronLeft, close, starEmpty, starFilled } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../../button';
import InputControl from '../../input-control';
import Modal from '../';
import type { ModalProps } from '../types';
import {
	NavigatorProvider,
	NavigatorScreen,
	NavigatorButton,
	NavigatorToParentButton,
	useNavigator,
} from '../../navigator';

const meta: Meta< typeof Modal > = {
	component: Modal,
	title: 'Components/Modal',
	argTypes: {
		children: {
			control: { type: null },
		},
		onKeyDown: {
			control: { type: null },
		},
		focusOnMount: {
			options: [ true, false, 'firstElement', 'firstContentElement' ],
			control: { type: 'select' },
		},
		role: {
			control: { type: 'text' },
		},
		onRequestClose: {
			action: 'onRequestClose',
		},
		isDismissible: {
			control: { type: 'boolean' },
		},
	},
	parameters: {
		controls: { expanded: true },
	},
};
export default meta;

const Template: StoryFn< typeof Modal > = ( { onRequestClose, ...args } ) => {
	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal: ModalProps[ 'onRequestClose' ] = ( event ) => {
		setOpen( false );
		onRequestClose( event );
	};

	return (
		<>
			<Button variant="secondary" onClick={ openModal }>
				Open Modal
			</Button>
			{ isOpen && (
				<Modal onRequestClose={ closeModal } { ...args }>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit,
						sed do eiusmod tempor incididunt ut labore et magna
						aliqua. Ut enim ad minim veniam, quis nostrud
						exercitation ullamco laboris nisi ut aliquip ex ea ea
						commodo consequat. Duis aute irure dolor in
						reprehenderit in voluptate velit esse cillum dolore eu
						fugiat nulla pariatur. Excepteur sint occaecat cupidatat
						non proident, sunt in culpa qui officia deserunt mollit
						anim id est laborum.
					</p>

					<InputControl style={ { marginBottom: '20px' } } />

					<Button variant="secondary" onClick={ closeModal }>
						Close Modal
					</Button>
				</Modal>
			) }
		</>
	);
};

export const Default: StoryFn< typeof Modal > = Template.bind( {} );
Default.args = {
	title: 'Title',
};
Default.parameters = {
	docs: {
		source: {
			code: '',
		},
	},
};

export const WithsizeSmall: StoryFn< typeof Modal > = Template.bind( {} );
WithsizeSmall.args = {
	size: 'small',
};
WithsizeSmall.storyName = 'With size: small';

const LikeButton = () => {
	const [ isLiked, setIsLiked ] = useState( false );
	return (
		<Button
			icon={ isLiked ? starFilled : starEmpty }
			label="Like"
			onClick={ () => setIsLiked( ! isLiked ) }
		/>
	);
};

export const WithHeaderActions: StoryFn< typeof Modal > = Template.bind( {} );
WithHeaderActions.args = {
	...Default.args,
	headerActions: <LikeButton />,
	isDismissible: false,
};
WithHeaderActions.parameters = {
	...Default.parameters,
};

export const WithNavigator: StoryFn< typeof Modal > = () => {
	const fonts = new Map( [
		[ 'a', { name: 'Font A', variants: [ 'Italic 100', 'Regular 400' ] } ],
		[ 'b', { name: 'Font B', variants: [ 'Regular 100', 'Regular 400' ] } ],
		[ 'c', { name: 'Font C', variants: [ 'Regular 100', 'Bold 100' ] } ],
	] );

	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );
	const modalHeaderId = useId();
	const headerStyle: CSSProperties = { display: 'flex' };
	const titleStyle: CSSProperties = { margin: 0 };
	const listStyle: CSSProperties = {
		listStyle: 'none',
		margin: '1em 0',
		padding: 0,
	};
	const itemStyle: CSSProperties = {
		display: 'flex',
		padding: '6px 12px',
		fontSize: 14,
		alignItems: 'stretch',
		boxSizing: 'border-box',
		justifyContent: 'space-between',
	};

	function FontNavigator() {
		return (
			<NavigatorProvider initialPath="/">
				<NavigatorScreen path="/">
					<FontList />
				</NavigatorScreen>

				<NavigatorScreen path="/:font">
					<FontPage />
				</NavigatorScreen>
			</NavigatorProvider>
		);
	}

	function FontList() {
		return (
			<div>
				<header style={ headerStyle }>
					<h1 id={ modalHeaderId } style={ titleStyle }>
						Font Manager
					</h1>
				</header>
				<ol style={ listStyle }>
					{ Array.from( fonts.entries(), ( [ id, { name } ] ) => (
						<li>
							<NavigatorButton
								path={ `/${ id }` }
								key={ id }
								style={ itemStyle }
							>
								{ name }
							</NavigatorButton>
						</li>
					) ) }
				</ol>
			</div>
		);
	}

	function FontPage() {
		const {
			params: { font: id },
		} = useNavigator();
		const font = fonts.get( id.toString() );

		if ( ! font ) {
			return (
				<div>
					<header style={ headerStyle }>
						<NavigatorToParentButton
							icon={ chevronLeft }
							label="Back"
						/>
						<h1 id={ modalHeaderId } style={ titleStyle }>
							Not found
						</h1>
					</header>
				</div>
			);
		}

		const { name, variants } = font;

		return (
			<div>
				<header style={ headerStyle }>
					<NavigatorToParentButton
						icon={ chevronLeft }
						label="Back"
					/>
					<h1 id={ modalHeaderId } style={ titleStyle }>
						{ name }
					</h1>
				</header>
				<ul style={ listStyle }>
					{ variants.map( ( variant, index ) => (
						<li key={ index }>
							{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
							<label style={ itemStyle }>
								{ variant }
								<input type="checkbox" />
							</label>
						</li>
					) ) }
				</ul>
			</div>
		);
	}

	return (
		<>
			<Button variant="secondary" onClick={ openModal }>
				Open Font Manager
			</Button>
			{ isOpen && (
				<Modal
					__experimentalHideHeader={ true }
					aria-labelledby={ modalHeaderId }
					size="large"
					onRequestClose={ closeModal }
				>
					<FontNavigator />
					<Button
						icon={ close }
						label="Close"
						onClick={ closeModal }
						style={ {
							position: 'absolute',
							right: 32,
							top: 32,
						} }
					/>
				</Modal>
			) }
		</>
	);
};
