/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './block.scss';
import { registerBlockType, createBlock } from '../../api';
import InserterMenu from '../../../editor/inserter/menu';

const { BACKSPACE, ESCAPE } = keycodes;

registerBlockType( 'core/inserter', {
	title: __( 'Inserter' ),

	transforms: {
		from: [
			{
				type: 'pattern',
				trigger: 'character',
				character: '/',
				transform: () => createBlock( 'core/inserter' ),
			},
		],
	},

	edit( { className, onReplace } ) {
		const onSelect = ( name ) => {
			if ( ! name ) {
				return;
			}

			onReplace( [
				createBlock( name ),
			] );
		};

		const onKeyDown = ( event ) => {
			const { keyCode, target } = event;

			if ( ( keyCode === BACKSPACE && target.value === '' ) || keyCode === ESCAPE ) {
				event.preventDefault();
				onReplace( [
					createBlock( 'core/paragraph' ),
				] );
			}
		};

		const style = {
			margin: 0,
			border: '1px solid #e2e4e7',
		};

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				className={ `editor-inserter ${ className }` }
				style={ style }
				onKeyDown={ onKeyDown }
			>
				<InserterMenu onSelect={ onSelect } />
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	},

	save() {
		return null;
	},
} );
