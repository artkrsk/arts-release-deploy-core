import React from 'react';
import { useTokenValidation } from '../hooks';
import { getString } from '../utils';
const { useState } = wp.element;
const { TextControl, Button, Notice } = wp.components;
export const TokenField = ({ initialValue, onChange }) => {
    const [value, setValue] = useState(initialValue);
    const [showPassword, setShowPassword] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const isConstantDefined = window.releaseDeployEDD.contexts.settings?.isConstantDefined || false;
    const ajaxUrl = window.releaseDeployEDD.ajaxUrl;
    const nonce = window.releaseDeployEDD.contexts.settings?.nonce || '';
    /** Use validation hook for business logic */
    const { status, rateLimit, isLoadingRateLimit, validateToken, refreshStatus } = useTokenValidation({
        initialToken: initialValue,
        ajaxUrl,
        nonce,
        isConstantDefined
    });
    const handleChange = (newValue) => {
        setValue(newValue);
        onChange(newValue);
    };
    const handleBlur = () => {
        if (value && value.trim()) {
            validateToken(value);
        }
    };
    const handleRefresh = async () => {
        await refreshStatus(value || initialValue);
    };
    const getStatusContent = () => {
        if (status === 'checking' || isLoadingRateLimit) {
            return {
                text: getString('token.checking'),
                icon: 'release-deploy-edd-icon_loading',
                fullText: getString('token.checking'),
                isClickable: false
            };
        }
        if (status === 'valid') {
            let fullText = getString('token.connected');
            if (rateLimit) {
                fullText += ` (${rateLimit.remaining}/${rateLimit.limit} ${getString('token.apiCalls')})`;
            }
            return {
                text: getString('token.connected'),
                icon: 'release-deploy-edd-icon_success',
                fullText: fullText,
                isClickable: true
            };
        }
        if (status === 'invalid') {
            return {
                text: getString('token.invalid'),
                icon: 'release-deploy-edd-icon_error',
                fullText: getString('token.invalid'),
                isClickable: false
            };
        }
        return { text: '', icon: '', fullText: '', isClickable: false };
    };
    const statusContent = getStatusContent();
    return (React.createElement("div", null,
        React.createElement("div", { className: "release-deploy-edd-token-field" },
            React.createElement(TextControl, { type: showPassword ? 'text' : 'password', value: isConstantDefined ? '' : value, onChange: handleChange, onBlur: handleBlur, maxLength: 255, placeholder: isConstantDefined
                    ? getString('token.managedViaConstant')
                    : 'github_pat...', disabled: status === 'checking' || isConstantDefined, help: isConstantDefined
                    ? getString('token.constantHelp')
                    : getString('token.enterHelp'), className: isConstantDefined ? 'release-deploy-edd-token-field__input_constant' : '' }),
            !isConstantDefined && (React.createElement("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "release-deploy-edd-token-field__toggle", "aria-label": showPassword
                    ? getString('token.hide')
                    : getString('token.show') },
                React.createElement("span", { className: `dashicons ${showPassword ? 'dashicons-hidden' : 'dashicons-visibility'}` })))),
        React.createElement("div", { className: `release-deploy-edd-token-status release-deploy-edd-token-status_${status}${statusContent.isClickable ? ' release-deploy-edd-token-status_clickable' : ''}`, onClick: statusContent.isClickable ? handleRefresh : undefined, title: statusContent.isClickable ? getString('token.refresh') : '' },
            statusContent.icon && (React.createElement("span", { className: `release-deploy-edd-token-status__icon ${statusContent.icon}` })),
            React.createElement("span", { className: "release-deploy-edd-token-status__text" }, statusContent.fullText)),
        !isConstantDefined && (React.createElement("div", { className: "release-deploy-edd-token-instructions-toggle" },
            React.createElement(Button, { variant: "link", onClick: () => setShowInstructions(!showInstructions) },
                showInstructions ? '▼' : '▶',
                ' ',
                getString('token.howToCreate')))),
        showInstructions && !isConstantDefined && (React.createElement(Notice, { status: "info" },
            React.createElement("ol", { className: "release-deploy-edd-token-instructions" },
                React.createElement("li", null, getString('token.instruction1')),
                React.createElement("li", null, getString('token.instruction2')),
                React.createElement("li", null, getString('token.instruction3')),
                React.createElement("li", null, getString('token.instruction4')),
                React.createElement("li", null, getString('token.instruction5')),
                React.createElement("li", null, getString('token.instruction6'))))),
        !isConstantDefined && (React.createElement("input", { type: "hidden", name: "edd_settings[edd_release_deploy_token]", value: value }))));
};
