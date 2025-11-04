import React from 'react';
import { TokenField } from './TokenField';
const { useState } = wp.element;
/** Settings app component */
export const SettingsApp = () => {
    const [token, setToken] = useState(window.releaseDeployEDD?.contexts?.settings?.token || '');
    return (React.createElement("div", { className: "release-deploy-edd-settings" },
        React.createElement(TokenField, { initialValue: token, onChange: setToken })));
};
