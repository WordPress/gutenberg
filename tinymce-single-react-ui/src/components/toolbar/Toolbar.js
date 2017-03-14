import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames';


import * as Icons from '../../external/dashicons'
import Button from '../button/Button'
import styles from './toolbar.scss'

export default class Toolbar extends React.Component {

	render() {

		let sideToolbarStyles = cx(styles.toolbar, styles.sideToolbar)

		return (
			<div>
				<div className={styles.toolbar}>
					<Button>
						<Icons.EditorBoldIcon />
					</Button>
					<Button>
						<Icons.EditorItalicIcon />
					</Button>
					<Button>
						<Icons.EditorStrikethroughIcon />
					</Button>
				</div>
				<div className={sideToolbarStyles} onMouseEnter={ () => { } }>
						<Button>
							<Icons.EditorAlignLeftIcon />
						</Button>
						<Button>
							<Icons.EditorAlignCenterIcon />
						</Button>
						<Button>
							<Icons.EditorAlignRightIcon />
						</Button>
						<Button>
							<Icons.EditorParagraphIcon />
						</Button>
				</div>
			</div>
		)
	}
}