import React from 'react'
import type { ITokenFieldProps, IRateLimit } from '../interfaces'
import type { TValidationStatus } from '../types'
import { GitHubService } from '../services'
import { getString } from '../utils'

const { useState, useEffect } = wp.element
const { TextControl, Button, Notice } = wp.components

export const TokenField = ({ initialValue, onChange }: ITokenFieldProps): JSX.Element => {
  const [value, setValue] = useState(initialValue)
  const [status, setStatus] = useState<TValidationStatus>('idle')
  const [showPassword, setShowPassword] = useState(false)
  const [rateLimit, setRateLimit] = useState<IRateLimit | null>(null)
  const [isLoadingRateLimit, setIsLoadingRateLimit] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const isConstantDefined = window.releaseDeployEDD.contexts.settings?.isConstantDefined || false

  useEffect(() => {
    if (initialValue || isConstantDefined) {
      validateToken(initialValue)
    }
  }, [])

  const validateToken = async (token: string) => {
    if (!token && !isConstantDefined) {
      setStatus('idle')
      setRateLimit(null)
      return
    }

    setStatus('checking')

    try {
      const isValid = await GitHubService.testConnection(
        window.releaseDeployEDD.ajaxUrl,
        window.releaseDeployEDD.contexts.settings?.nonce || '',
        token || ''
      )

      setStatus(isValid ? 'valid' : 'invalid')

      // Fetch rate limit if connection is valid
      if (isValid) {
        const limit = await GitHubService.getRateLimit(
          window.releaseDeployEDD.ajaxUrl,
          window.releaseDeployEDD.contexts.settings?.nonce || ''
        )
        setRateLimit(limit)
      } else {
        setRateLimit(null)
      }
    } catch (error) {
      setStatus('invalid')
      setRateLimit(null)
    }
  }

  const handleChange = (newValue: string) => {
    setValue(newValue)
    onChange(newValue)

    if (status !== 'idle') {
      setStatus('idle')
    }
  }

  const handleBlur = () => {
    if (value) {
      validateToken(value)
    }
  }

  const refreshStatus = async () => {
    if (status === 'checking' || isLoadingRateLimit) {
      return
    }

    // Only refresh if we have a valid token
    if (!value && !isConstantDefined) {
      return
    }

    setIsLoadingRateLimit(true)

    try {
      // Re-validate the token (which also fetches rate limit)
      await validateToken(value || initialValue)
    } catch (error) {
      // Error handling is done in validateToken
    } finally {
      setIsLoadingRateLimit(false)
    }
  }

  const getStatusContent = () => {
    if (status === 'checking' || isLoadingRateLimit) {
      return {
        text: getString('token.checking'),
        icon: 'release-deploy-edd-icon_loading',
        fullText: getString('token.checking'),
        isClickable: false
      }
    }

    if (status === 'valid') {
      let fullText: string = getString('token.connected')

      if (rateLimit) {
        fullText += ` (${rateLimit.remaining}/${rateLimit.limit} ${getString('token.apiCalls')})`
      }

      return {
        text: getString('token.connected'),
        icon: 'release-deploy-edd-icon_success',
        fullText: fullText,
        isClickable: true
      }
    }

    if (status === 'invalid') {
      return {
        text: getString('token.invalid'),
        icon: 'release-deploy-edd-icon_error',
        fullText: getString('token.invalid'),
        isClickable: false
      }
    }

    return { text: '', icon: '', fullText: '', isClickable: false }
  }

  const statusContent = getStatusContent()

  return (
    <div>
      <div className="release-deploy-edd-token-field">
        <TextControl
          type={showPassword ? 'text' : 'password'}
          value={isConstantDefined ? '' : value}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={255}
          placeholder={
            isConstantDefined
              ? getString('token.managedViaConstant')
              : 'github_pat...'
          }
          disabled={status === 'checking' || isConstantDefined}
          help={
            isConstantDefined
              ? getString('token.constantHelp')
              : getString('token.enterHelp')
          }
          className={isConstantDefined ? 'release-deploy-edd-token-field__input_constant' : ''}
        />
        {!isConstantDefined && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="release-deploy-edd-token-field__toggle"
            aria-label={
              showPassword
                ? getString('token.hide')
                : getString('token.show')
            }
          >
            <span
              className={`dashicons ${showPassword ? 'dashicons-hidden' : 'dashicons-visibility'}`}
            ></span>
          </button>
        )}
      </div>
      <div
        className={`release-deploy-edd-token-status release-deploy-edd-token-status_${status}${statusContent.isClickable ? ' release-deploy-edd-token-status_clickable' : ''}`}
        onClick={statusContent.isClickable ? refreshStatus : undefined}
        title={statusContent.isClickable ? getString('token.refresh') : ''}
      >
        {statusContent.icon && (
          <span className={`release-deploy-edd-token-status__icon ${statusContent.icon}`}></span>
        )}
        <span className="release-deploy-edd-token-status__text">{statusContent.fullText}</span>
      </div>

      {!isConstantDefined && (
        <div className="mb-15">
          <Button variant="link" onClick={() => setShowInstructions(!showInstructions)}>
            {showInstructions ? '▼' : '▶'}{' '}
            {getString('token.howToCreate')}
          </Button>
        </div>
      )}

      {showInstructions && !isConstantDefined && (
        <Notice status="info" isDismissible={false}>
          <ol className="release-deploy-edd-token-instructions">
            <li>{getString('token.instruction1')}</li>
            <li>{getString('token.instruction2')}</li>
            <li>{getString('token.instruction3')}</li>
            <li>{getString('token.instruction4')}</li>
            <li>{getString('token.instruction5')}</li>
            <li>{getString('token.instruction6')}</li>
          </ol>
        </Notice>
      )}

      {!isConstantDefined && (
        <input type="hidden" name="edd_settings[edd_release_deploy_token]" value={value} />
      )}
    </div>
  )
}
