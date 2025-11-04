import { useState, useEffect } from 'react';
import { GitHubService } from '../services';
/**
 * Custom hook for GitHub token validation and rate limit fetching
 * Separates business logic from TokenField UI component
 *
 * @param config - Configuration object
 * @returns Token validation state and functions
 */
export function useTokenValidation({ initialToken, ajaxUrl, nonce, isConstantDefined, gitHubService = GitHubService }) {
    const [status, setStatus] = useState('idle');
    const [rateLimit, setRateLimit] = useState(null);
    const [isLoadingRateLimit, setIsLoadingRateLimit] = useState(false);
    /** Validate a GitHub token and fetch rate limit if valid */
    const validateToken = async (token) => {
        if (!token && !isConstantDefined) {
            setStatus('idle');
            setRateLimit(null);
            return;
        }
        setStatus('checking');
        try {
            const isValid = await gitHubService.testConnection(ajaxUrl, nonce, token || '');
            setStatus(isValid ? 'valid' : 'invalid');
            // Fetch rate limit if connection is valid
            if (isValid) {
                const limit = await gitHubService.getRateLimit(ajaxUrl, nonce);
                setRateLimit(limit);
            }
            else {
                setRateLimit(null);
            }
        }
        catch (error) {
            setStatus('invalid');
            setRateLimit(null);
        }
    };
    /** Refresh the validation status and rate limit */
    const refreshStatus = async (token) => {
        if (status === 'checking' || isLoadingRateLimit) {
            return;
        }
        // Only refresh if we have a valid token
        if (!token && !isConstantDefined) {
            return;
        }
        setIsLoadingRateLimit(true);
        try {
            await validateToken(token);
        }
        catch (error) {
            // Error handling is done in validateToken
        }
        finally {
            setIsLoadingRateLimit(false);
        }
    };
    // Auto-validate on mount if token exists
    useEffect(() => {
        if (initialToken || isConstantDefined) {
            validateToken(initialToken);
        }
    }, []);
    return {
        status,
        rateLimit,
        isLoadingRateLimit,
        validateToken,
        refreshStatus
    };
}
