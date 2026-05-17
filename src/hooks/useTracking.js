import { useEffect, useCallback } from "react";
import { trackingService } from "../services/trackingService";

export function useTracking(pageName) {
    useEffect(() => {
        trackingService.track('page_view', { element: pageName });
    }, [pageName]);

    const trackClick = useCallback((element, data = {}) => {
        trackingService.track('click', { element, ...data });
    }, []);

    return { trackClick };
}
