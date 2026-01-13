import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { LeafletProvider, createLeafletContext } from '@react-leaflet/core';
import { Map as LeafletMap, type MapOptions, type LatLngExpression, type LatLngBoundsExpression, type FitBoundsOptions } from 'leaflet';

/**
 * Why this exists
 * react-leaflet's MapContainer creates the Leaflet map inside a ref callback.
 * In React 18 (tabs/offscreen/suspense), the same DOM node can get reused and
 * still carry Leaflet's internal `_leaflet_id`, causing:
 *   "Map container is already initialized."
 *
 * Fix
 * We implement a tiny "safe" MapContainer equivalent that ALWAYS clears
 * `node._leaflet_id` *right before* instantiating LeafletMap.
 */
export type LeafletMapContainerProps = {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: React.ReactNode;
  whenReady?: () => void;
  center?: LatLngExpression;
  zoom?: number;
  bounds?: LatLngBoundsExpression;
  boundsOptions?: FitBoundsOptions;
  children?: React.ReactNode;
} & Omit<MapOptions, 'center' | 'zoom' | 'crs'>;

const LeafletMapContainer = forwardRef<LeafletMap | null, LeafletMapContainerProps>(
  ({ id, className, style, placeholder, whenReady, center, zoom, bounds, boundsOptions, children, ...options }, forwardedRef) => {
    const [context, setContext] = useState<ReturnType<typeof createLeafletContext> | null>(null);
    const mapInstanceRef = useRef<LeafletMap | null>(null);

    useImperativeHandle(forwardedRef, () => mapInstanceRef.current, []);

    const mapRef = useCallback(
      (node: HTMLDivElement | null) => {
        if (!node || mapInstanceRef.current) return;

        // Critical: clear Leaflet's internal marker so reuse never crashes.
        const anyNode = node as any;
        if (anyNode._leaflet_id != null) {
          try {
            delete anyNode._leaflet_id;
          } catch {
            anyNode._leaflet_id = undefined;
          }
        }

        const map = new LeafletMap(node, options as any);
        mapInstanceRef.current = map;

        if (center != null && zoom != null) {
          map.setView(center, zoom);
        } else if (bounds != null) {
          map.fitBounds(bounds, boundsOptions);
        }

        if (whenReady) {
          map.whenReady(whenReady);
        }

        setContext(createLeafletContext(map));
      },
      // Intentionally empty deps to match react-leaflet behavior
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    useEffect(() => {
      return () => {
        const map = mapInstanceRef.current;
        mapInstanceRef.current = null;
        if (map) {
          try {
            map.remove();
          } catch {
            // ignore
          }
        }
      };
    }, []);

    return (
      <div id={id} className={className} style={style} ref={mapRef}>
        {context ? <LeafletProvider value={context}>{children}</LeafletProvider> : (placeholder ?? null)}
      </div>
    );
  }
);

LeafletMapContainer.displayName = 'LeafletMapContainer';

export default LeafletMapContainer;
