import React from 'react'
import { TokenField } from './TokenField'

const { useState } = wp.element

/** Settings app component */

export const SettingsApp = (): JSX.Element => {
  const [token, setToken] = useState(window.releaseDeployEDD?.contexts?.settings?.token || '')

  return (
    <div className="release-deploy-edd-settings">
      <TokenField initialValue={token} onChange={setToken} />
    </div>
  )
}
