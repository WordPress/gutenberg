import React, { createElement, Component } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames';

import * as Icons from '../../external/dashicons'
import Button from '../button/Button'
import styles from './blocktoolbar.scss'
import {blockIconMap, blockList} from '../../utils/tag'

export default function BlockChangeToolbar(props) {

  return props.isOpen ? (
    <div className={styles.horizontal}>
      {blockList.map( (choice, index) => (
        <Button key={index} extraClass={ [ styles.horizontal ] }
          status={ (choice === props.selected) ? 'ACTIVE' : 'INACTIVE' }>
          {blockIconMap[choice]}
        </Button>
        )
      )}
      </div>
  ) : null;
}
