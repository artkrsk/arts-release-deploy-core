import React from 'react';
import { getString } from '../utils';
/** Pro feature badge component */
export const ProBadge = ({ label, icon, showWrapper = true, renderAsLink = true, href, text, status = 'default', openInNewWindow = true }) => {
    const badgeText = text || getString('common.getPro');
    /** Determine CSS class based on status */
    const statusClass = status !== 'default' ? ` arts-license-pro-badge_${status}` : '';
    const badgeClassName = `arts-license-pro-badge${statusClass}`;
    // Only render as link if renderAsLink is true AND href is provided
    const shouldRenderAsLink = renderAsLink && href;
    const badge = shouldRenderAsLink ? (React.createElement("a", { href: href, className: badgeClassName, "aria-label": `${badgeText} - Pro feature`, ...(openInNewWindow && { target: '_blank', rel: 'noopener noreferrer' }) }, badgeText)) : (React.createElement("span", { className: badgeClassName, role: "status", "aria-label": `${badgeText} - Pro feature` }, badgeText));
    if (!showWrapper) {
        return badge;
    }
    return (React.createElement("span", { className: "arts-license-pro-badge-wrapper" },
        icon && React.createElement("span", { className: `dashicons ${icon}`, role: "img", "aria-hidden": "true" }),
        label && React.createElement("span", { className: "arts-license-pro-badge-wrapper__label" }, label),
        badge));
};
